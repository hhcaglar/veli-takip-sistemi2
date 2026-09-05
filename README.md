# Ders Takip

React + Vite ile hazırlanmış öğrenci/veli ders takip arayüzü.

## Çalıştırma

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
```

Oluşan `dist` klasörü Cloudflare Pages, Netlify veya Vercel üzerinde yayınlanabilir.

> Bu sürüm tarayıcıdaki `localStorage` kullanır. Bu nedenle veriler cihaz/tarayıcıya özeldir. Öğretmen ve velilerin ortak veritabanı üzerinden çalışması için bir sonraki aşamada Supabase Auth + PostgreSQL bağlantısı eklenmelidir.
