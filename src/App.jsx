import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  GraduationCap, Users, BookOpen, ClipboardList, TrendingUp, CalendarDays,
  Lightbulb, MessageCircle, Plus, Trash2, Check, X, ChevronRight, Settings,
  Phone, RotateCcw, Copy, Send, AlertTriangle, CheckCircle2, Circle,
} from "lucide-react";

/* ---------------------------------- helpers --------------------------------- */

const STORAGE_KEY = "ders-takip:data-v1";
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const round1 = (n) => Math.round(n * 10) / 10;
const netOf = (dogru, yanlis) => round1(Math.max(0, dogru - yanlis / 4));
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
};

function sampleData() {
  const mk = (name, grade, parentName, parentPhone) => ({
    id: uid(),
    name,
    grade,
    parentName,
    parentPhone,
    subjects: [
      {
        id: uid(),
        name: "Matematik",
        topics: [
          { id: uid(), name: "Rasyonel Sayılar", done: true },
          { id: uid(), name: "Basit Eşitsizlikler", done: true },
          { id: uid(), name: "Üslü İfadeler", done: false },
          { id: uid(), name: "Köklü İfadeler", done: false },
        ],
      },
      {
        id: uid(),
        name: "Türkçe",
        topics: [
          { id: uid(), name: "Sözcükte Anlam", done: true },
          { id: uid(), name: "Cümlede Anlam", done: true },
          { id: uid(), name: "Paragraf", done: true },
          { id: uid(), name: "Ses Bilgisi", done: false },
        ],
      },
    ],
    exams: [],
    homeworks: [],
    weeklyPlan: [],
  });

  const s1 = mk("Elif Demir", "8. Sınıf", "Ayşe Demir", "905551112233");
  const s2 = mk("Kerem Aydın", "7. Sınıf", "Murat Aydın", "905554445566");

  const matId1 = s1.subjects[0].id, turId1 = s1.subjects[1].id;
  s1.exams = [
    { id: uid(), date: "2026-08-05", type: "deneme", results: [
      { subject: "Matematik", dogru: 14, yanlis: 4 },
      { subject: "Türkçe", dogru: 16, yanlis: 2 },
    ]},
    { id: uid(), date: "2026-08-19", type: "deneme", results: [
      { subject: "Matematik", dogru: 16, yanlis: 3 },
      { subject: "Türkçe", dogru: 17, yanlis: 1 },
    ]},
    { id: uid(), date: "2026-08-30", type: "test", results: [
      { subject: "Matematik", dogru: 9, yanlis: 1 },
    ]},
  ];
  s1.homeworks = [
    { id: uid(), title: "Üslü İfadeler Test Kitabı s.24-26", subject: "Matematik", dueDate: "2026-09-01", status: "bekliyor" },
    { id: uid(), title: "Paragraf Soru Bankası 20 Soru", subject: "Türkçe", dueDate: "2026-08-28", status: "teslim" },
  ];
  s1.weeklyPlan = DAYS.map((d, i) => ({ id: uid(), day: d, task: i % 2 === 0 ? "Matematik: 20 soru" : "Türkçe: 1 paragraf seti", done: i < 2 }));

  s2.homeworks = [
    { id: uid(), title: "Sözcükte Anlam Tekrar Föyü", subject: "Türkçe", dueDate: "2026-08-20", status: "gecikti" },
  ];
  s2.weeklyPlan = DAYS.map((d) => ({ id: uid(), day: d, task: "", done: false }));

  return { students: [s1, s2], role: "ogretmen", activeStudentId: s1.id };
}

/* ------------------------------ small UI atoms ------------------------------ */

function Btn({ children, onClick, variant = "primary", size = "md", icon: Icon, disabled, title }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8,
    fontFamily: "Inter, sans-serif", fontWeight: 600, cursor: disabled ? "default" : "pointer",
    border: "1px solid transparent", transition: "background .15s, transform .05s",
    opacity: disabled ? 0.5 : 1,
  };
  const sizes = { sm: { padding: "6px 10px", fontSize: 12.5 }, md: { padding: "9px 14px", fontSize: 14 } };
  const variants = {
    primary: { background: "var(--navy)", color: "#fff" },
    accent: { background: "var(--amber)", color: "#2A1D00" },
    ghost: { background: "transparent", color: "var(--navy)", border: "1px solid var(--line)" },
    danger: { background: "transparent", color: "var(--coral)", border: "1px solid transparent" },
  };
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: "var(--paper-card)", border: "1px solid var(--line)", borderRadius: 12,
      padding: 18, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && <Icon size={18} color="var(--navy)" />}
        <h2 style={{ fontFamily: "Newsreader, serif", fontSize: 20, fontWeight: 600, color: "var(--ink)", margin: 0 }}>
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{
      padding: "28px 16px", textAlign: "center", color: "#8A94A0", fontSize: 13.5,
      border: "1px dashed var(--line)", borderRadius: 10,
    }}>
      {text}
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    bekliyor: { bg: "#FFF4DC", fg: "#8A5A00", label: "Bekliyor" },
    teslim: { bg: "#E5F4EA", fg: "#1F7A44", label: "Teslim edildi" },
    gecikti: { bg: "#FBE6E2", fg: "#B23A22", label: "Gecikti" },
  };
  const s = map[status] || map.bekliyor;
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 999 }}>
      {s.label}
    </span>
  );
}

/* --------------------------------- app shell --------------------------------- */

export default function DersTakipApp() {
  const [loaded, setLoaded] = useState(false);
  const [students, setStudents] = useState([]);
  const [role, setRole] = useState("ogretmen"); // 'ogretmen' | 'veli'
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [tab, setTab] = useState("konular");
  const [saveErr, setSaveErr] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);

  // load
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        const data = JSON.parse(res.value);
        setStudents(data.students || []);
        setRole(data.role || "ogretmen");
        setActiveStudentId(data.activeStudentId || (data.students?.[0]?.id ?? null));
      } catch (e) {
        const seed = sampleData();
        setStudents(seed.students);
        setRole(seed.role);
        setActiveStudentId(seed.activeStudentId);
        try { await window.storage.set(STORAGE_KEY, JSON.stringify(seed)); } catch (_) {}
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // persist (debounced-ish via effect on changes)
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const result = await window.storage.set(STORAGE_KEY, JSON.stringify({ students, role, activeStudentId }));
        setSaveErr(!result);
      } catch (e) {
        setSaveErr(true);
      }
    })();
  }, [students, role, activeStudentId, loaded]);

  const isTeacher = role === "ogretmen";
  const activeStudent = useMemo(() => students.find((s) => s.id === activeStudentId) || null, [students, activeStudentId]);

  const updateStudent = useCallback((id, updater) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? updater(s) : s)));
  }, []);

  const addStudent = (name, grade, parentName, parentPhone) => {
    const s = { id: uid(), name, grade, parentName, parentPhone, subjects: [], exams: [], homeworks: [], weeklyPlan: DAYS.map((d) => ({ id: uid(), day: d, task: "", done: false })) };
    setStudents((prev) => [...prev, s]);
    setActiveStudentId(s.id);
    setShowAddStudent(false);
  };

  const removeStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (activeStudentId === id) setActiveStudentId((prev) => students.find((s) => s.id !== id)?.id ?? null);
  };

  const resetAll = async () => {
    if (!window.confirm("Tüm veriler örnek verilerle değiştirilecek. Emin misin?")) return;
    const seed = sampleData();
    setStudents(seed.students);
    setRole(seed.role);
    setActiveStudentId(seed.activeStudentId);
  };

  if (!loaded) {
    return (
      <Wrap>
        <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#8A94A0", fontFamily: "Inter, sans-serif" }}>
          Yükleniyor…
        </div>
      </Wrap>
    );
  }

  const tabs = [
    { id: "konular", label: "Konular", icon: BookOpen },
    { id: "sinavlar", label: "Sınavlar", icon: TrendingUp },
    { id: "odevler", label: "Ödevler", icon: ClipboardList },
    { id: "plan", label: "Haftalık Plan", icon: CalendarDays },
    { id: "oneriler", label: "Öneriler", icon: Lightbulb },
    ...(isTeacher ? [{ id: "rapor", label: "Rapor", icon: MessageCircle }] : []),
  ];

  return (
    <Wrap>
      <div style={{ display: "flex", height: "100%", minHeight: 640, fontFamily: "Inter, sans-serif" }}>
        {/* Sidebar */}
        <aside style={{
          width: 240, flexShrink: 0, background: "var(--navy)", color: "#EAF0F7",
          display: "flex", flexDirection: "column", padding: "18px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px 18px" }}>
            <GraduationCap size={22} color="var(--amber)" />
            <span style={{ fontFamily: "Newsreader, serif", fontSize: 19, fontWeight: 600, letterSpacing: 0.2 }}>DersTakip</span>
          </div>

          {/* role switch */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.08)", borderRadius: 8, padding: 3, marginBottom: 16 }}>
            {[{ id: "ogretmen", label: "Öğretmen" }, { id: "veli", label: "Veli" }].map((r) => (
              <button
                key={r.id}
                onClick={() => setRole(r.id)}
                style={{
                  flex: 1, padding: "6px 4px", borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12.5, fontWeight: 700, fontFamily: "Inter, sans-serif",
                  background: role === r.id ? "var(--amber)" : "transparent",
                  color: role === r.id ? "#2A1D00" : "#C9D6E4",
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px 6px" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3, color: "#93A5BC" }}>
              {isTeacher ? "ÖĞRENCİLER" : "ÇOCUĞUNU SEÇ"}
            </span>
            {isTeacher && (
              <button onClick={() => setShowAddStudent(true)} title="Öğrenci ekle" style={{ background: "none", border: "none", color: "#C9D6E4", cursor: "pointer", padding: 2 }}>
                <Plus size={16} />
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
            {students.length === 0 && <div style={{ color: "#93A5BC", fontSize: 12.5, padding: "8px 4px" }}>Henüz öğrenci yok.</div>}
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveStudentId(s.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                  padding: "8px 10px", borderRadius: 8, border: "none", textAlign: "left", cursor: "pointer",
                  background: activeStudentId === s.id ? "rgba(227,160,8,0.16)" : "transparent",
                  color: activeStudentId === s.id ? "#fff" : "#C9D6E4",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,0.14)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11.5, fontWeight: 700, flexShrink: 0,
                  }}>
                    {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13.5, fontWeight: 600 }}>
                    {s.name}
                  </span>
                </span>
                {activeStudentId === s.id && <ChevronRight size={14} />}
              </button>
            ))}
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", marginTop: 10, paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={resetAll} style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", color: "#93A5BC", fontSize: 12, cursor: "pointer", padding: "4px 2px" }}>
              <RotateCcw size={13} /> Örnek verilere sıfırla
            </button>
            {saveErr && <span style={{ color: "#F0B4A6", fontSize: 11 }}>Kaydetme hatası — bağlantı sorunu olabilir.</span>}
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "var(--paper)" }}>
          {!activeStudent ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Empty text="Görüntülemek için soldan bir öğrenci seç ya da yeni öğrenci ekle." />
            </div>
          ) : (
            <>
              <StudentHeader student={activeStudent} isTeacher={isTeacher} onRemove={removeStudent} />

              <nav style={{ display: "flex", gap: 2, padding: "0 24px", borderBottom: "1px solid var(--line)", overflowX: "auto" }}>
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "12px 14px", border: "none",
                      background: "none", cursor: "pointer", whiteSpace: "nowrap",
                      borderBottom: tab === t.id ? "2px solid var(--navy)" : "2px solid transparent",
                      color: tab === t.id ? "var(--navy)" : "#8A94A0",
                      fontWeight: tab === t.id ? 700 : 600, fontSize: 13.5,
                    }}
                  >
                    <t.icon size={15} /> {t.label}
                  </button>
                ))}
              </nav>

              <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                {tab === "konular" && <TopicsPanel student={activeStudent} isTeacher={isTeacher} update={(u) => updateStudent(activeStudent.id, u)} />}
                {tab === "sinavlar" && <ExamsPanel student={activeStudent} isTeacher={isTeacher} update={(u) => updateStudent(activeStudent.id, u)} />}
                {tab === "odevler" && <HomeworkPanel student={activeStudent} isTeacher={isTeacher} update={(u) => updateStudent(activeStudent.id, u)} />}
                {tab === "plan" && <WeeklyPlanPanel student={activeStudent} isTeacher={isTeacher} update={(u) => updateStudent(activeStudent.id, u)} />}
                {tab === "oneriler" && <SuggestionsPanel student={activeStudent} />}
                {tab === "rapor" && isTeacher && <ReportPanel student={activeStudent} />}
              </div>
            </>
          )}
        </main>
      </div>

      {showAddStudent && <AddStudentModal onClose={() => setShowAddStudent(false)} onAdd={addStudent} />}
    </Wrap>
  );
}

function Wrap({ children }) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 640 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        :root {
          --paper: #EEF1F4;
          --paper-card: #FFFFFF;
          --ink: #1F2A37;
          --navy: #1E3A5F;
          --amber: #E3A008;
          --sage: #3F8F5F;
          --coral: #D64933;
          --line: #DCE2E8;
        }
        * { box-sizing: border-box; }
        body, input, select, textarea, button { font-family: 'Inter', sans-serif; color: var(--ink); }
        input, select { font-size: 13.5px; padding: 7px 10px; border: 1px solid var(--line); border-radius: 7px; outline: none; background: #fff; }
        input:focus, select:focus { border-color: var(--navy); }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: #C7CFD8; border-radius: 8px; }
      `}</style>
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", height: "100%", minHeight: 640 }}>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------- student header ------------------------------ */

function StudentHeader({ student, isTeacher, onRemove }) {
  const totalTopics = student.subjects.reduce((a, s) => a + s.topics.length, 0);
  const doneTopics = student.subjects.reduce((a, s) => a + s.topics.filter((t) => t.done).length, 0);
  const totalHw = student.homeworks.length;
  const doneHw = student.homeworks.filter((h) => h.status === "teslim").length;
  const exams = student.exams;
  const lastExamNet = exams.length ? round1(exams[exams.length - 1].results.reduce((a, r) => a + netOf(r.dogru, r.yanlis), 0)) : null;

  return (
    <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 style={{ fontFamily: "Newsreader, serif", fontSize: 24, fontWeight: 700, margin: 0, color: "var(--ink)" }}>{student.name}</h1>
        <div style={{ fontSize: 13, color: "#6B7684", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span>{student.grade}</span>
          {student.parentName && <span>· Veli: {student.parentName}</span>}
          {student.parentPhone && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Phone size={12} /> {student.parentPhone}</span>}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <MiniStat label="İşlenen konu" value={`${doneTopics}/${totalTopics}`} />
        <MiniStat label="Ödev tamamlama" value={totalHw ? `%${Math.round((doneHw / totalHw) * 100)}` : "-"} />
        <MiniStat label="Son sınav neti" value={lastExamNet ?? "-"} accent />
        {isTeacher && (
          <Btn variant="danger" size="sm" icon={Trash2} onClick={() => { if (window.confirm(`${student.name} silinsin mi?`)) onRemove(student.id); }}>
            Öğrenciyi sil
          </Btn>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }) {
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 14px", minWidth: 100 }}>
      <div style={{ fontSize: 10.5, color: "#8A94A0", fontWeight: 700, letterSpacing: 0.3 }}>{label}</div>
      <div style={{ fontFamily: "Newsreader, serif", fontSize: 19, fontWeight: 700, color: accent ? "var(--amber)" : "var(--navy)" }}>{value}</div>
    </div>
  );
}

/* ---------------------------------- konular ---------------------------------- */

function TopicsPanel({ student, isTeacher, update }) {
  const [newSubject, setNewSubject] = useState("");
  const [topicDraft, setTopicDraft] = useState({}); // subjectId -> text

  const addSubject = () => {
    if (!newSubject.trim()) return;
    update((s) => ({ ...s, subjects: [...s.subjects, { id: uid(), name: newSubject.trim(), topics: [] }] }));
    setNewSubject("");
  };
  const removeSubject = (subjectId) => update((s) => ({ ...s, subjects: s.subjects.filter((x) => x.id !== subjectId) }));
  const addTopic = (subjectId) => {
    const text = (topicDraft[subjectId] || "").trim();
    if (!text) return;
    update((s) => ({ ...s, subjects: s.subjects.map((sub) => sub.id === subjectId ? { ...sub, topics: [...sub.topics, { id: uid(), name: text, done: false }] } : sub) }));
    setTopicDraft((d) => ({ ...d, [subjectId]: "" }));
  };
  const toggleTopic = (subjectId, topicId) => update((s) => ({
    ...s, subjects: s.subjects.map((sub) => sub.id === subjectId ? { ...sub, topics: sub.topics.map((t) => t.id === topicId ? { ...t, done: !t.done } : t) } : sub),
  }));
  const removeTopic = (subjectId, topicId) => update((s) => ({
    ...s, subjects: s.subjects.map((sub) => sub.id === subjectId ? { ...sub, topics: sub.topics.filter((t) => t.id !== topicId) } : sub),
  }));

  return (
    <div>
      <SectionTitle icon={BookOpen}>Konu Takibi</SectionTitle>

      {student.subjects.length === 0 && <Empty text="Henüz ders eklenmedi." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {student.subjects.map((sub) => {
          const done = sub.topics.filter((t) => t.done).length;
          const pct = sub.topics.length ? Math.round((done / sub.topics.length) * 100) : 0;
          return (
            <Card key={sub.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontFamily: "Newsreader, serif", fontSize: 16.5, fontWeight: 700 }}>{sub.name}</h3>
                {isTeacher && (
                  <button onClick={() => removeSubject(sub.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#B7C0CA" }}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div style={{ height: 6, background: "var(--paper)", borderRadius: 4, marginBottom: 4, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "var(--sage)" : "var(--amber)" }} />
              </div>
              <div style={{ fontSize: 11.5, color: "#8A94A0", marginBottom: 10 }}>{done}/{sub.topics.length} konu tamamlandı</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: isTeacher ? 10 : 0 }}>
                {sub.topics.map((t) => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <button
                      onClick={() => isTeacher && toggleTopic(sub.id, t.id)}
                      style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: isTeacher ? "pointer" : "default", padding: 0, textAlign: "left" }}
                    >
                      {t.done ? <CheckCircle2 size={16} color="var(--sage)" /> : <Circle size={16} color="#C7CFD8" />}
                      <span style={{ fontSize: 13.5, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#9AA5B1" : "var(--ink)" }}>{t.name}</span>
                    </button>
                    {isTeacher && (
                      <button onClick={() => removeTopic(sub.id, t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D6DCE2" }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isTeacher && (
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <input
                    placeholder="Yeni konu ekle…"
                    value={topicDraft[sub.id] || ""}
                    onChange={(e) => setTopicDraft((d) => ({ ...d, [sub.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addTopic(sub.id)}
                    style={{ flex: 1 }}
                  />
                  <Btn size="sm" variant="ghost" icon={Plus} onClick={() => addTopic(sub.id)}>Ekle</Btn>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {isTeacher && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <input placeholder="Yeni ders adı (örn. Fen Bilimleri)" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubject()} style={{ width: 260 }} />
          <Btn size="sm" icon={Plus} onClick={addSubject}>Ders Ekle</Btn>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- sınavlar ---------------------------------- */

function ExamsPanel({ student, isTeacher, update }) {
  const [showForm, setShowForm] = useState(false);

  const removeExam = (examId) => update((s) => ({ ...s, exams: s.exams.filter((e) => e.id !== examId) }));

  const chartData = student.exams
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: fmtDate(e.date),
      net: round1(e.results.reduce((a, r) => a + netOf(r.dogru, r.yanlis), 0)),
    }));

  return (
    <div>
      <SectionTitle icon={TrendingUp} right={isTeacher && <Btn size="sm" icon={Plus} onClick={() => setShowForm(true)}>Sonuç Ekle</Btn>}>
        Test &amp; Deneme Sonuçları
      </SectionTitle>

      {student.exams.length === 0 ? (
        <Empty text="Henüz sınav sonucu girilmedi." />
      ) : (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8A94A0", marginBottom: 8 }}>NET GELİŞİMİ</div>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11.5, fill: "#8A94A0" }} axisLine={{ stroke: "var(--line)" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11.5, fill: "#8A94A0" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 12.5 }} />
                  <Line type="monotone" dataKey="net" stroke="var(--navy)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--amber)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {student.exams.slice().sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
              const total = round1(e.results.reduce((a, r) => a + netOf(r.dogru, r.yanlis), 0));
              return (
                <Card key={e.id} style={{ padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#8A94A0" }}>{e.type === "deneme" ? "Deneme" : "Test"}</span>
                      <span style={{ fontSize: 13, color: "#6B7684" }}>{fmtDate(e.date)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontFamily: "Newsreader, serif", fontWeight: 700, color: "var(--navy)" }}>{total} net</span>
                      {isTeacher && <button onClick={() => removeExam(e.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D6DCE2" }}><Trash2 size={14} /></button>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
                    {e.results.map((r, i) => (
                      <span key={i} style={{ fontSize: 12, color: "#6B7684" }}>
                        {r.subject}: <b style={{ color: "var(--ink)" }}>{r.dogru}D / {r.yanlis}Y</b> ({netOf(r.dogru, r.yanlis)} net)
                      </span>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {showForm && (
        <ExamFormModal
          subjects={student.subjects.map((s) => s.name)}
          onClose={() => setShowForm(false)}
          onSave={(exam) => { update((s) => ({ ...s, exams: [...s.exams, exam] })); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function ExamFormModal({ subjects, onClose, onSave }) {
  const [type, setType] = useState("test");
  const [date, setDate] = useState(todayISO());
  const [rows, setRows] = useState([{ subject: subjects[0] || "", dogru: "", yanlis: "" }]);

  const addRow = () => setRows((r) => [...r, { subject: subjects[0] || "", dogru: "", yanlis: "" }]);
  const setRow = (i, patch) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));

  const save = () => {
    const results = rows.filter((r) => r.subject && r.dogru !== "").map((r) => ({ subject: r.subject, dogru: Number(r.dogru) || 0, yanlis: Number(r.yanlis) || 0 }));
    if (!results.length) return;
    onSave({ id: uid(), date, type, results });
  };

  return (
    <ModalShell onClose={onClose} title="Sınav Sonucu Ekle">
      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <label style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#6B7684" }}>
          Tür
          <select value={type} onChange={(e) => setType(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }}>
            <option value="test">Test</option>
            <option value="deneme">Deneme</option>
          </select>
        </label>
        <label style={{ flex: 1, fontSize: 12, fontWeight: 700, color: "#6B7684" }}>
          Tarih
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ display: "block", width: "100%", marginTop: 4 }} />
        </label>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input placeholder="Ders" value={row.subject} onChange={(e) => setRow(i, { subject: e.target.value })} style={{ flex: 2 }} list="subject-list" />
            <input placeholder="Doğru" type="number" min="0" value={row.dogru} onChange={(e) => setRow(i, { dogru: e.target.value })} style={{ flex: 1 }} />
            <input placeholder="Yanlış" type="number" min="0" value={row.yanlis} onChange={(e) => setRow(i, { yanlis: e.target.value })} style={{ flex: 1 }} />
            {rows.length > 1 && <button onClick={() => removeRow(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#B7C0CA" }}><X size={15} /></button>}
          </div>
        ))}
        <datalist id="subject-list">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
      </div>

      {type === "deneme" && <Btn size="sm" variant="ghost" icon={Plus} onClick={addRow}>Ders Ekle</Btn>}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn variant="ghost" onClick={onClose}>Vazgeç</Btn>
        <Btn onClick={save}>Kaydet</Btn>
      </div>
    </ModalShell>
  );
}

/* ---------------------------------- ödevler ---------------------------------- */

function HomeworkPanel({ student, isTeacher, update }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState(student.subjects[0]?.name || "");
  const [dueDate, setDueDate] = useState(todayISO());

  const add = () => {
    if (!title.trim()) return;
    update((s) => ({ ...s, homeworks: [...s.homeworks, { id: uid(), title: title.trim(), subject, dueDate, status: "bekliyor" }] }));
    setTitle("");
  };
  const setStatus = (id, status) => update((s) => ({ ...s, homeworks: s.homeworks.map((h) => h.id === id ? { ...h, status } : h) }));
  const remove = (id) => update((s) => ({ ...s, homeworks: s.homeworks.filter((h) => h.id !== id) }));

  const list = student.homeworks.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div>
      <SectionTitle icon={ClipboardList}>Ödev Yönetimi</SectionTitle>

      {list.length === 0 ? <Empty text="Henüz ödev verilmedi." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: isTeacher ? 18 : 0 }}>
          {list.map((h) => (
            <Card key={h.id} style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{h.title}</div>
                <div style={{ fontSize: 12, color: "#8A94A0" }}>{h.subject} · Teslim: {fmtDate(h.dueDate)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isTeacher ? (
                  <select value={h.status} onChange={(e) => setStatus(h.id, e.target.value)}>
                    <option value="bekliyor">Bekliyor</option>
                    <option value="teslim">Teslim edildi</option>
                    <option value="gecikti">Gecikti</option>
                  </select>
                ) : <StatusPill status={h.status} />}
                {isTeacher && <button onClick={() => remove(h.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#D6DCE2" }}><Trash2 size={14} /></button>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {isTeacher && (
        <Card>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#8A94A0", marginBottom: 10 }}>YENİ ÖDEV</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input placeholder="Ödev başlığı" value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 2, minWidth: 180 }} />
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
              {student.subjects.length === 0 && <option value="">Ders yok</option>}
              {student.subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ flex: 1, minWidth: 140 }} />
            <Btn icon={Plus} onClick={add}>Ekle</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------- haftalık plan -------------------------------- */

function WeeklyPlanPanel({ student, isTeacher, update }) {
  const plan = student.weeklyPlan.length ? student.weeklyPlan : DAYS.map((d) => ({ id: uid(), day: d, task: "", done: false }));

  const setTask = (id, task) => update((s) => ({ ...s, weeklyPlan: (s.weeklyPlan.length ? s.weeklyPlan : plan).map((p) => p.id === id ? { ...p, task } : p) }));
  const toggleDone = (id) => update((s) => ({ ...s, weeklyPlan: (s.weeklyPlan.length ? s.weeklyPlan : plan).map((p) => p.id === id ? { ...p, done: !p.done } : p) }));

  useEffect(() => {
    if (!student.weeklyPlan.length) update((s) => ({ ...s, weeklyPlan: plan }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <SectionTitle icon={CalendarDays}>Haftalık Çalışma Planı</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
        {plan.map((p) => (
          <Card key={p.id} style={{ padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--navy)" }}>{p.day}</span>
              <button onClick={() => isTeacher && toggleDone(p.id)} style={{ background: "none", border: "none", cursor: isTeacher ? "pointer" : "default" }}>
                {p.done ? <CheckCircle2 size={16} color="var(--sage)" /> : <Circle size={16} color="#C7CFD8" />}
              </button>
            </div>
            {isTeacher ? (
              <textarea
                value={p.task}
                onChange={(e) => setTask(p.id, e.target.value)}
                placeholder="Görev ekle…"
                rows={3}
                style={{ width: "100%", resize: "none", fontSize: 12.5, border: "1px solid var(--line)", borderRadius: 6, padding: 6 }}
              />
            ) : (
              <div style={{ fontSize: 12.5, color: p.task ? "var(--ink)" : "#B7C0CA", minHeight: 40, textDecoration: p.done ? "line-through" : "none" }}>
                {p.task || "Görev yok"}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------- öneriler ---------------------------------- */

function buildSuggestions(student) {
  const out = [];
  student.subjects.forEach((sub) => {
    if (sub.topics.length === 0) return;
    const pct = sub.topics.filter((t) => t.done).length / sub.topics.length;
    if (pct < 0.5) out.push({ type: "warn", text: `${sub.name} dersinde konuların yarısından azı tamamlandı — tekrar planı oluştur.` });
  });

  const overdue = student.homeworks.filter((h) => h.status !== "teslim" && h.dueDate < todayISO());
  overdue.forEach((h) => out.push({ type: "danger", text: `"${h.title}" ödevinin teslim tarihi geçti (${fmtDate(h.dueDate)}).` }));

  const sorted = student.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length >= 2) {
    const last = round1(sorted[sorted.length - 1].results.reduce((a, r) => a + netOf(r.dogru, r.yanlis), 0));
    const prev = round1(sorted[sorted.length - 2].results.reduce((a, r) => a + netOf(r.dogru, r.yanlis), 0));
    if (last < prev) out.push({ type: "warn", text: `Son sınavda net düşüşü var (${prev} → ${last}). Ek çalışma planlanmalı.` });
    else out.push({ type: "good", text: `Net gelişimi olumlu (${prev} → ${last}). Bu tempoyu korumak için pekiştirme önerilir.` });
  } else if (sorted.length === 0) {
    out.push({ type: "info", text: "Henüz sınav sonucu girilmedi — gelişimi izlemek için ilk test/deneme sonucunu ekle." });
  }

  if (out.length === 0) out.push({ type: "good", text: "Şu an için dikkat gerektiren bir durum yok, öğrenci iyi gidiyor." });
  return out;
}

function SuggestionsPanel({ student }) {
  const suggestions = buildSuggestions(student);
  const iconFor = { warn: AlertTriangle, danger: AlertTriangle, good: CheckCircle2, info: Lightbulb };
  const colorFor = { warn: "#B8860B", danger: "var(--coral)", good: "var(--sage)", info: "var(--navy)" };
  const bgFor = { warn: "#FFF7E6", danger: "#FBEAE6", good: "#EAF6EE", info: "#EAF0F7" };

  return (
    <div>
      <SectionTitle icon={Lightbulb}>Akıllı Öneriler</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {suggestions.map((s, i) => {
          const Icon = iconFor[s.type];
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: bgFor[s.type], border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" }}>
              <Icon size={17} color={colorFor[s.type]} style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{s.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------ rapor ----------------------------------- */

function ReportPanel({ student }) {
  const [copied, setCopied] = useState(false);
  const totalTopics = student.subjects.reduce((a, s) => a + s.topics.length, 0);
  const doneTopics = student.subjects.reduce((a, s) => a + s.topics.filter((t) => t.done).length, 0);
  const totalHw = student.homeworks.length;
  const doneHw = student.homeworks.filter((h) => h.status === "teslim").length;
  const sorted = student.exams.slice().sort((a, b) => a.date.localeCompare(b.date));
  const lastNet = sorted.length ? round1(sorted[sorted.length - 1].results.reduce((a, r) => a + netOf(r.dogru, r.yanlis), 0)) : null;

  const text = [
    `📚 ${student.name} — Gelişim Raporu`,
    `Konu takibi: ${doneTopics}/${totalTopics} tamamlandı`,
    `Ödevler: ${doneHw}/${totalHw} teslim edildi`,
    lastNet !== null ? `Son sınav neti: ${lastNet}` : `Henüz sınav sonucu girilmedi`,
    ``,
    `— DersTakip`,
  ].join("\n");

  const waHref = `https://wa.me/${student.parentPhone || ""}?text=${encodeURIComponent(text)}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (_) {}
  };

  return (
    <div>
      <SectionTitle icon={MessageCircle}>Veli Raporu</SectionTitle>
      <Card style={{ maxWidth: 480 }}>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif", fontSize: 13.5, margin: 0, marginBottom: 14, lineHeight: 1.6 }}>{text}</pre>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn icon={Send} onClick={() => window.open(waHref, "_blank")}>WhatsApp'ta Gönder</Btn>
          <Btn variant="ghost" icon={Copy} onClick={copy}>{copied ? "Kopyalandı ✓" : "Metni Kopyala"}</Btn>
        </div>
        {!student.parentPhone && <div style={{ fontSize: 11.5, color: "#8A94A0", marginTop: 10 }}>Veli telefonu tanımlı değil — WhatsApp'ta alıcıyı manuel seçmen gerekecek.</div>}
      </Card>
    </div>
  );
}

/* ----------------------------------- modals ----------------------------------- */

function ModalShell({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,26,34,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, padding: 22, width: "100%", maxWidth: 440, boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontFamily: "Newsreader, serif", fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A94A0" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddStudentModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  return (
    <ModalShell title="Yeni Öğrenci Ekle" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input placeholder="Öğrenci adı" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Sınıf (örn. 8. Sınıf)" value={grade} onChange={(e) => setGrade(e.target.value)} />
        <input placeholder="Veli adı" value={parentName} onChange={(e) => setParentName(e.target.value)} />
        <input placeholder="Veli telefonu (90XXXXXXXXXX)" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
        <Btn variant="ghost" onClick={onClose}>Vazgeç</Btn>
        <Btn onClick={() => name.trim() && onAdd(name.trim(), grade.trim(), parentName.trim(), parentPhone.trim())}>Ekle</Btn>
      </div>
    </ModalShell>
  );
}
