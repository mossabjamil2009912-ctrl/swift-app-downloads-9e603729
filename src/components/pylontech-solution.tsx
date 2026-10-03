import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Download, Link2, ShieldCheck, X } from "lucide-react";
import type { Product } from "@/lib/products-data";
import type { PylonSolution } from "@/lib/pylontech-solutions";
import { officialCatalogUrl } from "@/lib/official-catalogs";
import actesLogo from "@/assets/actes-logo-full.webp";

export function PylontechSolution({ s, products, onClose, onProduct }: { s: PylonSolution; products: Product[]; onClose: () => void; onProduct: (id: string) => void }) {
  const list = s.products.map((id) => products.find((p) => p.id === id)).filter(Boolean) as Product[];
  useEffect(() => {
    const o = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = o; };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div dir="rtl" className="fixed inset-0 z-[90] overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <img src="/media/pylontech/logo.svg" alt="PYLONTECH" className="h-5 w-auto" />
          <span className="h-6 w-px bg-border" />
          <img src={actesLogo} alt="ACTES" className="h-8 w-auto" />
        </div>
        <button aria-label="إغلاق" onClick={onClose} className="rounded-full border border-border p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
      </div>

      {/* بايلونتك — الصورة والوصف الأصلي */}
      <section className="relative h-[300px] overflow-hidden sm:h-[380px]">
        <img src={s.img} alt={s.t} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />
        <div className="absolute bottom-6 right-5 left-5 mx-auto max-w-5xl text-background">
          <p className="text-xs tracking-widest opacity-75" dir="ltr" style={{ textAlign: "right" }}>PYLONTECH · {s.en}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{s.t}</h1>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-10 px-5 py-10">
        <section>
          <p className="leading-8 text-foreground/90">{s.pylon}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {s.scenario.map((x) => (
              <div key={x} className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />{x}</div>
            ))}
          </div>
        </section>

        {/* أكتس — المنتجات المتوفرة */}
        <section>
          <h2 className="text-xl font-bold">منتجات الحل المتوفرة لدى أكتس</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {list.map((p) => (
              <button key={p.id} onClick={() => onProduct(p.id)} className="group flex gap-4 rounded-2xl border border-border bg-card p-4 text-right transition hover:border-primary hover:shadow-lg">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-muted"><img src={p.image} alt={p.name} loading="lazy" className="max-h-20 object-contain" /></div>
                <div className="min-w-0">
                  <p className="font-bold" dir="ltr" style={{ textAlign: "right" }}>{p.model}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.name}</p>
                  <p className="mt-2 text-sm font-bold text-primary" dir="ltr" style={{ textAlign: "right" }}>{p.power}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* أكتس — التكامل الهندسي */}
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-primary"><ShieldCheck className="h-5 w-5" />التكامل الهندسي من أكتس</h2>
          <p className="mt-3 leading-7">{s.actes}</p>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold"><Link2 className="h-4 w-4" />متوافق مع منتجات أكتس:</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {s.pairs.map((x) => <li key={x} className="rounded-full border border-border bg-background px-3 py-1 text-xs">{x}</li>)}
          </ul>
        </section>

        {/* الكتالوجات */}
        <section>
          <h2 className="text-xl font-bold">الكتالوجات المعتمدة (عربي / English)</h2>
          <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
            {list.map((p) => {
              const ar = officialCatalogUrl(p, "ar"), en = officialCatalogUrl(p, "en");
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <span className="min-w-0 truncate" dir="ltr">{p.model}</span>
                  <span className="flex shrink-0 gap-2">
                    {ar && <a href={ar} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded border border-primary/40 px-2 py-1 text-xs text-primary hover:bg-primary/10"><Download className="h-3 w-3" />عربي</a>}
                    {en && <a href={en} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted" dir="ltr"><Download className="h-3 w-3" />EN</a>}
                    {!ar && !en && <span className="text-xs text-muted-foreground">قريباً</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3 pb-6">
          <Link to="/" className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:opacity-90">طلب عرض سعر للمنظومة</Link>
          <Link to="/" className="rounded-full border border-foreground/30 px-6 py-3 text-sm font-bold hover:bg-muted">دراسة الجدوى الاقتصادية</Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
