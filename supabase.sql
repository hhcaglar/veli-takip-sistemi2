-- DersTakip / Supabase kurulumu
-- Supabase Dashboard > SQL Editor içine tamamını yapıştırıp çalıştır.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'veli' check (role in ('ogretmen','veli')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  parent_user_id uuid references auth.users(id) on delete set null,
  parent_email text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists students_owner_id_idx on public.students(owner_id);
create index if not exists students_parent_user_id_idx on public.students(parent_user_id);
create index if not exists students_parent_email_idx on public.students(lower(parent_email));

-- Yeni kullanıcıların profili otomatik oluşur; güvenli varsayılan rol veli.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'veli', coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.students enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.students from anon;
grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.students to authenticated;

-- Profil: kullanıcı sadece kendi rolünü okuyabilir.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

-- Öğretmen tüm kendi öğrencilerini, veli sadece kendisine bağlanan öğrenciyi görebilir.
drop policy if exists "students_select_teacher_or_parent" on public.students;
create policy "students_select_teacher_or_parent"
on public.students for select to authenticated
using (
  (select auth.uid()) = owner_id
  or (select auth.uid()) = parent_user_id
);

-- Öğrenci oluşturma/güncelleme/silme sadece öğretmene ait.
drop policy if exists "students_insert_teacher" on public.students;
create policy "students_insert_teacher"
on public.students for insert to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'ogretmen'
  )
);

drop policy if exists "students_update_teacher" on public.students;
create policy "students_update_teacher"
on public.students for update to authenticated
using (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'ogretmen'
  )
)
with check (
  (select auth.uid()) = owner_id
);

drop policy if exists "students_delete_teacher" on public.students;
create policy "students_delete_teacher"
on public.students for delete to authenticated
using (
  (select auth.uid()) = owner_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'ogretmen'
  )
);

-- Veli hesabı açtıktan sonra, kendi e-posta adresine tanımlı öğrencileri hesabına bağlar.
create or replace function public.claim_my_students()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_count integer;
begin
  update public.students
  set parent_user_id = (select auth.uid()), updated_at = now()
  where parent_user_id is null
    and parent_email is not null
    and lower(parent_email) = lower((select auth.email()));
  get diagnostics changed_count = row_count;
  return changed_count;
end;
$$;

revoke execute on function public.claim_my_students() from public, anon;
grant execute on function public.claim_my_students() to authenticated;

-- GÜVENLİK NOTU:
-- İlk öğretmen hesabını Supabase Dashboard > Authentication > Users bölümünden oluştur.
-- Sonra aşağıdaki sorguda EMAIL kısmını öğretmenin gerçek e-postasıyla değiştirip çalıştır:
--
-- update public.profiles
-- set role = 'ogretmen', full_name = 'Hasan Hüseyin Çağlar'
-- where id = (select id from auth.users where email = 'EMAIL');
