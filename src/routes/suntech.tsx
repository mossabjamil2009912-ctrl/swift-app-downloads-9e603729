import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Download, FileText, Mail, Menu, X } from "lucide-react";
import actesLogo from "@/assets/actes-logo-full.webp";
import { PRODUCTS } from "@/lib/products-data";
import { officialCatalogUrl } from "@/lib/official-catalogs";

export const Route = createFileRoute("/suntech")({
  head: () => ({
    meta: [
      { title: "Suntech — ألواح شمسية | ACTES الوكيل المعتمد" },
      { name: "description", content: "موقع Suntech بالعربية: ألواح Ultra Series وN-Type ثنائية الوجه، المشاريع، التنزيلات والكتالوجات العربية لدى ACTES." },
      { property: "og:title", content: "Suntech — ألواح شمسية | ACTES" },
      { property: "og:description", content: "25 عاماً من تصنيع الألواح الكهروضوئية، أكثر من 55 GW شحنات عالمية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuntechPage,
});

const M = "/media/suntech";
const ACCENT = "text-[#e60012]";

const NAV = [
  { label: "من نحن", items: [["من نحن", "#about"], ["اتصل بنا", "#contact"]] },
  { label: "الأخبار", items: [["الأخبار 2026", "#news"]] },
  { label: "المنتجات", items: [["الألواح Module", "#products"], ["التخزين Storage", "#storage"], ["الحلول Solutions", "#storage"]] },
  { label: "المشاريع", items: [["محطات المرافق Utility", "#projects"], ["المشاريع التجارية والصناعية C&I", "#projects"], ["المنظومات السكنية Residential", "#projects"]] },
  { label: "التنزيلات", items: [["الملف التعريفي للشركة", "#downloads"], ["نشرات المنتجات Datasheet", "#downloads"], ["دليل التركيب", "#downloads"], ["ضمان المنتج", "#downloads"], ["شهادات الاعتماد", "#downloads"], ["الفيديو", "#about"]] },
] as const;

const SLIDES = [
  { img: `${M}/banner-20260408.webp`, title: "ULTRA SERIES", sub: "ألواح Suntech الجديدة بتقنية N-Type عالية الكفاءة" },
  { img: `${M}/SunStorage-banner-2-1.webp`, title: "SunStorage", sub: "حلول Suntech لتخزين الطاقة" },
];

const STATS = [
  ["25", "عاماً", "من الخبرة في تصنيع الألواح الكهروضوئية"],
  ["55 GW+", "", "إجمالي الشحنات العالمية التراكمية للألواح"],
  ["600+", "", "براءة اختراع معتمدة"],
  ["100+", "دولة", "انتشار أعمالنا حول العالم"],
];

const MODULES = ["STPXXXS-H48-N(kh,th,fb)+", "STPXXXS-H54-N(kh, th, fb)+", "STPXXXS-H66-Nsh+", "STPXXXS-D66-Nsh+", "STP-NT11/48QGD(S)F", "STP-NT11/66QGDF"];

const PROJECTS = [
  { t: "محطات المرافق", e: "Utility", img: `${M}/solar-module-banner-bg.jpg` },
  { t: "التجاري والصناعي", e: "Commercial & Industrial", img: `${M}/home-bg2-m.jpg` },
  { t: "السكني", e: "Residential", img: `${M}/home-bg3-m.jpg` },
];

function SuntechPage() {
  const items = PRODUCTS.filter((p) => p.brand === "Suntech");
  const [slide, setSlide] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background/95 backdrop-blur" onMouseLeave={() => setOpen(null)}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <img src={`${M}/logo-suntech.webp`} alt="Suntech" className="h-8 w-auto" />
            <span className="h-7 w-px bg-border" />
            <img src={actesLogo} alt="ACTES" className="h-8 w-auto" />
            <span className="hidden text-xs text-muted-foreground sm:inline">الوكيل المعتمد</span>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n, i) => (
              <button key={n.label} onMouseEnter={() => setOpen(i)} className={`flex items-center gap-1 px-3 py-5 text-sm hover:text-[#e60012] ${open === i ? ACCENT : ""}`}>
                {n.label}<ChevronDown className="h-3.5 w-3.5" />
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted sm:flex"><ArrowRight className="h-3.5 w-3.5" />الرئيسية</Link>
            <button className="lg:hidden" onClick={() => setMobile(true)} aria-label="القائمة"><Menu className="h-6 w-6" /></button>
          </div>
        </div>
        {open !== null && (
          <div className="hidden border-t border-border bg-background shadow-lg lg:block">
            <div className="mx-auto flex max-w-7xl gap-10 px-5 py-6">
              {NAV[open]?.items.map(([t, h]) => <a key={t} href={h} onClick={() => setOpen(null)} className="text-sm hover:text-[#e60012]">{t}</a>)}
            </div>
          </div>
        )}
      </header>

      {mobile && (
        <div className="fixed inset-0 z-40 bg-foreground/40" onClick={() => setMobile(false)}>
          <div className="mr-auto h-full w-72 overflow-y-auto bg-background p-5" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobile(false)} aria-label="إغلاق" className="mb-4"><X className="h-6 w-6" /></button>
            {NAV.map((n) => (
              <details key={n.label} className="border-b border-border py-2">
                <summary className="cursor-pointer font-medium">{n.label}</summary>
                {n.items.map(([t, h]) => <a key={t} href={h} onClick={() => setMobile(false)} className="block py-1.5 pr-3 text-sm text-muted-foreground">{t}</a>)}
              </details>
            ))}
            <Link to="/" className="mt-4 block text-sm">← الرئيسية</Link>
          </div>
        </div>
      )}

      <section className="relative h-[100svh] min-h-[520px] overflow-hidden">
        {SLIDES.map((s, i) => (
          <div key={s.title} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}>
            <img src={s.img} alt={s.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-foreground/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-24 mx-auto max-w-7xl px-5 text-background">
              <h1 className="text-4xl font-bold tracking-wide md:text-6xl" dir="ltr" style={{ textAlign: "right" }}>{s.title}</h1>
              <p className="mt-3 text-lg">{s.sub}</p>
              <a href="#products" className="mt-6 inline-block rounded-full bg-[#e60012] px-6 py-2.5 text-sm font-medium text-background">اعرف المزيد</a>
            </div>
          </div>
        ))}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
          {SLIDES.map((s, i) => <button key={s.title} onClick={() => setSlide(i)} aria-label={s.title} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-background" : "w-4 bg-background/50"}`} />)}
        </div>
      </section>

      <section id="products" className="bg-muted/40 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:grid-cols-2">
          <div>
            <p className={`text-sm font-semibold ${ACCENT}`} dir="ltr" style={{ textAlign: "right" }}>ULTRA SERIES</p>
            <h2 className="mt-2 text-3xl font-bold">STAND THE TEST OF TIME</h2>
            <p className="mt-2 text-xl">صُممت لتصمد أمام اختبار الزمن</p>
            <p className="mt-4 leading-8 text-muted-foreground">ألواح Suntech من سلسلة Ultra بخلايا N-Type وتقنية ثنائية الوجه (Bifacial) وزجاج مزدوج، لإنتاج أعلى وموثوقية طويلة في الظروف القاسية.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {MODULES.map((m) => <span key={m} dir="ltr" className="rounded border border-border bg-background px-2 py-1 text-xs">{m}</span>)}
            </div>
          </div>
          <img src={`${M}/solar-module-banner.png`} alt="Ultra Series solar module" className="mx-auto w-full max-w-lg" />
        </div>
        <div className="mx-auto mt-14 grid max-w-7xl gap-6 px-5 md:grid-cols-2">
          {items.map((p) => {
            const ar = officialCatalogUrl(p, "ar");
            const en = officialCatalogUrl(p, "en");
            return (
              <div key={p.id} className="flex gap-5 rounded-lg border border-border bg-background p-5">
                <img src={p.image} alt={p.model} className="h-40 w-28 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">متوفر لدى ACTES</p>
                  <h3 className="mt-1 font-bold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{p.model}</p>
                  <p className={`mt-2 text-lg font-bold ${ACCENT}`} dir="ltr" style={{ textAlign: "right" }}>{p.power}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ar && <a href={ar} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-[#e60012] px-3 py-1.5 text-xs text-background"><FileText className="h-3.5 w-3.5" />الكتالوج بالعربية</a>}
                    {en && <a href={en} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs"><Download className="h-3.5 w-3.5" />EN Datasheet</a>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="about" className="relative overflow-hidden py-24 text-background">
        <video src={`${M}/video-aboutus.mp4`} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
          {STATS.map(([n, u, d]) => (
            <div key={d}>
              <p className="text-4xl font-bold md:text-5xl" dir="ltr" style={{ textAlign: "right" }}>{n}</p>
              {u && <p className="text-lg">{u}</p>}
              <p className="mt-2 text-sm text-background/80">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="storage" className="relative h-[60vh] min-h-[380px] overflow-hidden">
        <img src={`${M}/SunStorage-banner-2-1.webp`} alt="SunStorage" className="h-full w-full object-cover" />
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-foreground/70 to-transparent">
          <div className="mx-auto w-full max-w-7xl px-5 pb-12 text-background">
            <h2 className="text-3xl font-bold">التخزين والحلول Storage & Solutions</h2>
            <p className="mt-2">أنظمة تخزين الطاقة وحلول الألواح حسب نوع المشروع.</p>
          </div>
        </div>
      </section>

      <section id="projects" className="relative overflow-hidden py-20">
        <video src={`${M}/project-v-bg.mp4`} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="relative mx-auto max-w-7xl px-5">
          <h2 className="text-center text-3xl font-bold">خريطة مشاريع Suntech</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground" dir="ltr">SUNTECH PROJECT MAP</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PROJECTS.map((p) => (
              <div key={p.e} className="group relative h-80 overflow-hidden rounded-lg">
                <img src={p.img} alt={p.e} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-foreground/70 to-transparent p-5 text-background">
                  <p className="text-xl font-bold">{p.t}</p>
                  <p className="text-sm" dir="ltr" style={{ textAlign: "right" }}>{p.e}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="downloads" className="bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-2xl font-bold">التنزيلات</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.flatMap((p) => [["ar", "عربي"], ["en", "EN"]].map(([l, lab]) => {
              const u = officialCatalogUrl(p, l as "ar" | "en");
              return u ? <a key={p.id + l} href={u} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded border border-border bg-background p-4 text-sm hover:border-[#e60012]"><span dir="ltr">{p.model.split(" ")[0]} Datasheet</span><span className="flex items-center gap-1 text-muted-foreground"><Download className="h-4 w-4" />{lab}</span></a> : null;
            }))}
            {["الملف التعريفي للشركة", "دليل التركيب", "ضمان المنتج", "شهادات الاعتماد"].map((t) => (
              <a key={t} href="https://www.suntech-power.com/downloads/" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded border border-border bg-background p-4 text-sm hover:border-[#e60012]"><span>{t}</span><span className="text-xs text-muted-foreground">الموقع الرسمي</span></a>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">اتصل بنا</h2>
            <p className="mt-3 text-sm text-muted-foreground">Wuxi Suntech Power Co., Ltd. — Wuxi, China</p>
            <a href="https://www.suntech-power.com/contact-us/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm hover:text-[#e60012]"><Mail className="h-4 w-4" />صفحة التواصل الرسمية</a>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border p-5">
            <img src={actesLogo} alt="ACTES" className="h-12 w-auto" />
            <div><p className="font-bold">ACTES — الوكيل المعتمد لـ Suntech في اليمن</p><p className="text-sm text-muted-foreground">للاستشارات والتوريد والكتالوجات العربية المعتمدة.</p></div>
          </div>
        </div>
      </section>

      <footer className="bg-foreground py-8 text-sm text-background/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5">
          <p dir="ltr">©Copyright. Wuxi Suntech Power Co., Ltd. All Rights Reserved.</p>
          <div className="flex gap-4">{["Linkedin", "Facebook", "Twitter", "Instagram", "Youtube"].map((s) => <span key={s}>{s}</span>)}</div>
        </div>
      </footer>
    </main>
  );
}
