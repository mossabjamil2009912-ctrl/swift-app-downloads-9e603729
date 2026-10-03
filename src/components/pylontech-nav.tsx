import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, ChevronLeft, Download, Globe, Menu, Search, ShieldCheck, X } from "lucide-react";
import type { Product } from "@/lib/products-data";
import { officialCatalogUrl } from "@/lib/official-catalogs";
import { ContactPanel, ServicePanel } from "@/components/pylontech-forms";
import actesLogo from "@/assets/actes-logo-full.webp";

type Simple = { t: string; d?: string; h: string };
type Menu = { id: string; label: string; items: Simple[]; actes: Simple };

const SOLUTIONS: Simple[] = [
  { t: "أنظمة ESS السكنية", d: "Residential ESS", h: "#solutions" },
  { t: "بطاريات BESS السكنية", d: "Residential BESS", h: "#solutions" },
  { t: "أنظمة ESS للمرافق وC&I", d: "Utility, C&I ESS", h: "#solutions" },
  { t: "أنظمة ESS خارج الشبكة", d: "Off-Grid ESS", h: "#solutions" },
  { t: "منصة Pylontech Cloud", d: "المراقبة السحابية", h: "#solutions" },
];

// منتجات كل حل كما في القائمة الرسمية لموقع بايلونتك
type MP = { t: string; slug: string };
const BESS: MP[] = [
  { t: "Force H3X", slug: "force-h3x" },
  { t: "Fidus Battery", slug: "fidus-battery" },
  { t: "Fidus Max", slug: "fidus-max" },
  { t: "Fidus Battery Plus", slug: "fidus-battery-plus" },
  { t: "US5000", slug: "us5000" },
];
const SOL_PRODUCTS: MP[][] = [
  [{ t: "Force H3X", slug: "force-h3x" }],
  BESS,
  [
    { t: "OPTIM US A100-HY", slug: "optim-us-a100-hy" },
    { t: "OPTIM US A100-HY-PLUS", slug: "optim-us-a100-hy-plus" },
    { t: "OPTIM US A300-HY", slug: "optim-us-a300-hy" },
    { t: "OPTIM US L260-HY", slug: "optim-us-l260-hy" },
    { t: "OPTIM US L260-OMNI", slug: "optim-us-l260-omni" },
    { t: "OPTIM US L417-BAT", slug: "optim-us-l417-bat" },
    { t: "OPTIM US L520-OMNI", slug: "optim-us-l520-omni" },
  ],
  [
    { t: "US5000", slug: "us5000" },
    { t: "Fidus Battery", slug: "fidus-battery" },
    { t: "Force H3X", slug: "force-h3x" },
  ],
  [],
];

const MENUS: Menu[] = [
  {
    id: "support", label: "الخدمة والدعم",
    items: [
      { t: "كن شريكاً لنا", h: "#support" },
      { t: "مركز الخدمة", h: "#support" },
      { t: "تسجيل البطارية", h: "#support" },
      { t: "التحميلات", h: "#products" },
    ],
    actes: { t: "دعم ACTES الفني", d: "تركيب وضمان وصيانة عبر الوكيل المعتمد", h: "#support" },
  },
  {
    id: "contact", label: "اتصل بنا",
    items: [
      { t: "تواصل معنا", h: "#contact" },
      { t: "انضم إلينا", h: "#contact" },
    ],
    actes: { t: "تواصل مع ACTES", d: "استفسارات منتجات بايلونتك والدعم", h: "#contact" },
  },
];

function Downloads({ products }: { products: Product[] }) {
  const rows = products
    .map((p) => ({ p, ar: officialCatalogUrl(p, "ar"), en: officialCatalogUrl(p, "en") }))
    .filter((r) => r.ar || r.en);
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[#00a5b0]">التنزيلات — الكتالوجات (عربي / English)</p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {rows.map(({ p, ar, en }) => (
          <li key={p.id} className="flex items-center justify-between gap-3 p-2.5 text-sm">
            <span className="min-w-0 truncate">{p.name} <span className="text-xs text-muted-foreground" dir="ltr">({p.model})</span></span>
            <span className="flex shrink-0 gap-2">
              {ar && <a href={ar} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded border border-primary/40 px-2 py-1 text-xs text-primary hover:bg-primary/10"><Download className="h-3 w-3" />عربي</a>}
              {en && <a href={en} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted" dir="ltr"><Download className="h-3 w-3" />EN</a>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActesCard({ a, onClick }: { a: Simple; onClick?: () => void }) {
  return (
    <a href={a.h} onClick={onClick} className="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 hover:bg-primary/10">
      <img src={actesLogo} alt="ACTES" className="h-8 w-auto" />
      <div className="min-w-0 text-right">
        <p className="flex items-center gap-1 text-sm font-semibold text-primary"><ShieldCheck className="h-4 w-4" />{a.t}</p>
        {a.d && <p className="text-xs text-muted-foreground">{a.d}</p>}
      </div>
    </a>
  );
}

export function PylontechNav({ products }: { products: Product[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [acc, setAcc] = useState<string | null>(null);
  const shown = products.slice(0, 6);
  const close = () => { setOpen(null); setMobile(false); };

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-background/95 backdrop-blur" onMouseLeave={() => setOpen(null)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-3">
          <img src="/media/pylontech/logo.svg" alt="PYLONTECH" className="h-6 w-auto" />
          <span className="h-7 w-px bg-border" />
          <img src={actesLogo} alt="ACTES" className="h-9 w-auto" />
        </div>
        <nav className="hidden h-full items-stretch gap-7 text-[15px] lg:flex">
          {[{ id: "solutions", label: "المنتجات والحلول" }, ...MENUS].map((m) => (
            <button key={m.id} onMouseEnter={() => setOpen(m.id)} onClick={() => setOpen(open === m.id ? null : m.id)}
              className={`flex items-center gap-1 border-b-2 ${open === m.id ? "border-primary text-primary" : "border-transparent hover:text-primary"}`}>
              {m.label}<ChevronDown className="h-3.5 w-3.5" />
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Search className="h-5 w-5" />
          <span className="hidden items-center gap-1 sm:flex"><Globe className="h-4 w-4" /> عالمي - عربي</span>
          <Link to="/" aria-label="الرئيسية" className="rounded-full border border-border p-1.5 hover:bg-muted"><ArrowRight className="h-4 w-4" /></Link>
          <button aria-label="القائمة" className="lg:hidden" onClick={() => setMobile(true)}><Menu className="h-6 w-6" /></button>
        </div>
      </div>

      {/* قوائم سطح المكتب */}
      {open === "solutions" && (
        <div className="absolute inset-x-0 top-16 hidden border-t border-border bg-background shadow-xl lg:block">
          <div className="mx-auto flex min-h-[420px] max-w-7xl px-5">
            <div className="w-[260px] shrink-0 border-l border-border py-10 pl-6 pr-10">
              <p className="mb-5 text-lg font-medium">الحلول</p>
              {SOLUTIONS.map((s, k) => (
                <a key={s.t} href={s.h} onMouseEnter={() => setSel(k)} onClick={close}
                  className={`flex items-center gap-2 py-2.5 text-sm ${sel === k ? "text-[#00a5b0]" : "hover:text-[#00a5b0]"}`}>
                  <span>{s.t}</span>{sel === k && <ChevronLeft className="h-3.5 w-3.5" />}
                </a>
              ))}
            </div>
            <div className="flex-1 py-10 pr-12">
              <a href="#products" onClick={close} className="mb-6 flex items-center gap-1 text-base font-medium hover:text-[#00a5b0]">جميع المنتجات <ChevronLeft className="h-4 w-4" /></a>
              <p className="mb-5 text-sm text-[#00a5b0]">المنتجات</p>
              {(SOL_PRODUCTS[sel] ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد منتجات معروضة لهذا الحل حالياً.</p>
              ) : (
                <div className="grid grid-cols-4 gap-x-6 gap-y-6">
                  {SOL_PRODUCTS[sel]!.map((p) => (
                    <a key={p.slug} href="#products" onClick={close} className="w-[105px] text-center hover:text-[#00a5b0]">
                      <img src={`/media/pylontech/menu/${p.slug}.webp`} alt={p.t} className="mx-auto h-16 w-auto object-contain" loading="lazy" />
                      <p className="mt-2 text-xs" dir="ltr">{p.t}</p>
                    </a>
                  ))}
                </div>
              )}
              <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
                <img src={actesLogo} alt="ACTES" className="h-6 w-auto" />
                <span>ACTES — الوكيل المعتمد لبايلونتك</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {MENUS.map((m) => open === m.id && (
        <div key={m.id} className="absolute inset-x-0 top-16 hidden border-t border-border bg-background shadow-xl lg:block">
          <div className="mx-auto flex max-h-[calc(100vh-4rem)] max-w-7xl items-start justify-between gap-10 overflow-y-auto px-5 py-8">
            <div className="min-w-0 flex-1">
              <p className="mb-3 text-lg font-semibold">{m.label}</p>
              <div className="flex max-w-xs flex-col">
                {m.items.map((it) => <a key={it.t} href={it.h} onClick={close} className="py-2 text-sm hover:text-primary">{it.t}</a>)}
              </div>
              {m.id === "support" && <div className="mt-6 space-y-8"><ServicePanel /><Downloads products={products} /></div>}
              {m.id === "contact" && <div className="mt-6"><ContactPanel /></div>}
            </div>
            <div className="w-80"><ActesCard a={m.actes} onClick={close} /></div>
          </div>
        </div>
      ))}

      {/* قائمة الجوال */}
      {mobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMobile(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <img src={actesLogo} alt="ACTES" className="h-9 w-auto" />
              <button aria-label="إغلاق" onClick={() => setMobile(false)}><X className="h-6 w-6" /></button>
            </div>
            {[{ id: "solutions", label: "المنتجات والحلول", items: SOLUTIONS, actes: { t: "متوفر لدى ACTES", d: "الكتالوجات المعتمدة", h: "#products" } }, ...MENUS].map((m) => (
              <div key={m.id} className="border-b border-border">
                <button className="flex w-full items-center justify-between py-4 font-medium" onClick={() => setAcc(acc === m.id ? null : m.id)}>
                  {m.label}<ChevronDown className={`h-4 w-4 transition ${acc === m.id ? "rotate-180" : ""}`} />
                </button>
                {acc === m.id && (
                  <div className="pb-4">
                    {m.items.map((it) => <a key={it.t} href={it.h} onClick={close} className="block py-2 pr-3 text-sm text-muted-foreground">{it.t}</a>)}
                    {m.id === "support" && <Downloads products={products} />}
                    <ActesCard a={m.actes} onClick={close} />
                  </div>
                )}
              </div>
            ))}
          </aside>
        </div>
      )}
    </header>
  );
}
