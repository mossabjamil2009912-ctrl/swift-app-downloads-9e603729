import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, FileText } from "lucide-react";
import { EcoReport, type CustomSystem } from "./eco-report";

// دراسة الجدوى الاقتصادية: 24 خانة (ديزل لتر/ساعة أو أحمال kW) ثم 3 سيناريوهات للمنظومة
type Mode = "diesel" | "loads";

const PSH = 5.5; // ساعات الذروة الشمسية في اليمن
const PR = 0.8; // نسبة أداء المنظومة
const KWH_PER_L = 3.3; // كيلوواط ساعة لكل لتر ديزل في المولدات
const PV_USD_KWP = 450; // ألواح + تركيب لكل kWp
const BAT_USD_KWH = 300; // بطاريات ليثيوم لكل kWh
const INV_USD_KW = 150; // انفرتر هجين لكل kW
const DOD = 0.9;
const YEARS = 25;
const DEG = 0.005;
const OM = 0.01;
const DAY = (h: number) => h >= 7 && h < 17;

const hourLabel = (h: number) => {
  const f = (x: number) => (x % 12 === 0 ? 12 : x % 12);
  return `من ${f(h)} إلى ${f(h + 1)} ${h < 12 ? "صباحاً" : "مساءً"}`;
};
const nf = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });

type Scenario = {
  key: string; title: string; note: string; kwp: number; bat: number; inv: number;
  coverage: number; liters: number; saving: number; capex: number; payback: number | null; net: number; recommended: boolean;
};

function compute(kw: number[], dieselPrice: number): Scenario[] {
  const total = kw.reduce((s, v) => s + v, 0);
  const day = kw.reduce((s, v, h) => s + (DAY(h) ? v : 0), 0);
  const night = total - day;
  const peak = Math.max(...kw, 0);
  const defs = [
    { key: "day", title: "السيناريو 1 — التوفير النهاري", note: "ألواح تغطي أحمال النهار بدون بطاريات — أقل تكلفة وأسرع استرداد", pv: day, bat: 0 },
    { key: "hyb", title: "السيناريو 2 — الهجين المتوازن", note: "ألواح + بطاريات تغطي النهار و60% من الليل — الأفضل عائداً", pv: day + night * 0.6 * 1.1, bat: (night * 0.6) / DOD, recommended: true },
    { key: "max", title: "السيناريو 3 — الاستقلالية القصوى", note: "تغطية 95% من الاستهلاك وإيقاف شبه كامل للمولد", pv: total * 0.95 * 1.1, bat: (night * 0.95) / DOD },
  ];
  return defs.map((d) => {
    const covered = d.key === "day" ? day : d.key === "hyb" ? day + night * 0.6 : total * 0.95;
    const kwp = Math.ceil((d.pv / (PSH * PR)) * 10) / 10;
    const bat = Math.ceil(d.bat * 10) / 10;
    const inv = Math.ceil(peak * 1.25);
    const capex = Math.round(kwp * PV_USD_KWP + bat * BAT_USD_KWH + inv * INV_USD_KW);
    const liters = Math.round((covered / KWH_PER_L) * 365);
    const saving = Math.round(liters * dieselPrice * 1.1); // + 10% صيانة وزيوت المولد
    let cum = -capex; let payback: number | null = null;
    for (let y = 1; y <= YEARS; y++) {
      const net = saving * Math.pow(1 - DEG, y - 1) - capex * OM;
      const prev = cum; cum += net;
      if (payback === null && prev < 0 && cum >= 0 && net > 0) payback = y - 1 + Math.abs(prev) / net;
    }
    return { key: d.key, title: d.title, note: d.note, kwp, bat, inv, coverage: total > 0 ? Math.round((covered / total) * 100) : 0, liters, saving, capex, payback: payback === null ? null : Math.round(payback * 10) / 10, net: Math.round(cum), recommended: Boolean(d.recommended) };
  });
}

const INV_SIZES = [8, 12, 16, 20, 50];
const invPkg = (kw: number) => INV_SIZES.find((s) => s >= kw) ?? 50;

export function EcoFeasibility({ mode, onSales, onBuy }: { mode: Mode; onSales?: () => void; onBuy?: (loads: string) => void }) {
  const [values, setValues] = useState<string[]>(() => Array(24).fill(""));
  const [price, setPrice] = useState("1.1");
  const [done, setDone] = useState(false);
  const [same, setSame] = useState(false);
  const filled = values.filter((v) => v.trim() !== "" && !isNaN(Number(v))).length;
  const unit = mode === "diesel" ? "لتر/ساعة" : "kW";

  const kw = useMemo(() => values.map((v) => { const n = Math.max(0, Number(v) || 0); return mode === "diesel" ? n * KWH_PER_L : n; }), [values, mode]);
  const dp = Math.max(0, Number(price) || 0);
  const scenarios = useMemo(() => compute(kw, dp), [kw, dp]);
  const rec = scenarios.find((s) => s.recommended);
  const daily = kw.reduce((s, v) => s + v, 0);
  const dailyL = daily / KWH_PER_L;

  if (!done) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (filled === 24) setDone(true); }} className="rounded-lg border border-border bg-muted/35 p-5">
        <p className="text-sm font-black">{mode === "diesel" ? "بيانات الديزل" : "بيانات الاحمال"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "diesel" ? "اكتب استهلاك المولد من الديزل في كل ساعة باللتر — اكتب 0 للساعات التي لا يعمل فيها" : "اكتب الحمل المتوقع في كل ساعة بالكيلووات (kW) — اكتب 0 للساعات بلا أحمال"}
        </p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-bold">
          <input type="checkbox" checked={same} onChange={(e) => { const on = e.target.checked; setSame(on); if (on) { const v = values.find((x) => x.trim() !== "") ?? ""; setValues(Array(24).fill(v)); } }} className="size-4 accent-primary" />
          اعتماد نفس القيمة لكل الساعات
        </label>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {values.map((v, i) => (
            <label key={i} className="grid gap-1">
              <span className="text-[11px] font-bold text-muted-foreground">{hourLabel(i)}</span>
              <div className="relative">
                <input inputMode="decimal" value={v} onChange={(e) => { const val = e.target.value; setValues((p) => same ? Array(24).fill(val) : p.map((x, j) => (j === i ? val : x))); }} className="w-full rounded-md border border-border bg-background px-3 py-2 pe-14 text-sm tabular-nums" placeholder="0" />
                <span className="pointer-events-none absolute inset-y-0 end-2 flex items-center text-[10px] text-muted-foreground">{unit}</span>
              </div>
            </label>
          ))}
        </div>
        <label className="mt-4 grid max-w-xs gap-1">
          <span className="text-xs font-bold">سعر لتر الديزل بالدولار</span>
          <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm tabular-nums" />
        </label>
        <p className="mt-3 text-xs text-muted-foreground">تم إدخال {filled} من 24 خانة</p>
        <button type="submit" disabled={filled !== 24} className="mt-3 w-full rounded-md bg-skyline px-6 py-3 text-sm font-bold text-skyline-foreground disabled:opacity-50 sm:w-auto">احسب السيناريوهات الثلاثة</button>
      </form>
    );
  }

  if (filled === 24) {
    return <EcoReport kw={kw} price={dp} onEdit={() => setDone(false)} onSales={onSales} onBuy={onBuy ? () => onBuy(kw.map((v, h) => `${h}: ${Math.round(v * 100) / 100}`).join("\n")) : undefined} />;
  }
  void rec; void dailyL; void invPkg;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/35 p-4 text-sm">
        <p className="font-black">ملخص الاستهلاك الحالي</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div>الاستهلاك اليومي<br /><b className="tabular-nums">{nf(daily, 1)} kWh</b></div>
          <div>ديزل يومي مكافئ<br /><b className="tabular-nums">{nf(dailyL, 1)} لتر</b></div>
          <div>ديزل سنوي<br /><b className="tabular-nums">{nf(dailyL * 365)} لتر</b></div>
          <div>تكلفة الديزل السنوية<br /><b className="tabular-nums">{nf(dailyL * 365 * dp)} $</b></div>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {scenarios.map((s) => (
          <div key={s.key} className={`rounded-lg border p-4 ${s.recommended ? "border-primary bg-primary/5" : "border-border bg-background"}`}>
            {s.recommended && <span className="mb-2 inline-block rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">الموصى به</span>}
            <p className="text-sm font-black">{s.title}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{s.note}</p>
            <dl className="mt-3 space-y-1.5 text-xs">
              {[
                ["قدرة الألواح", `${nf(s.kwp, 1)} kWp`],
                ["سعة البطاريات", s.bat > 0 ? `${nf(s.bat, 1)} kWh` : "بدون"],
                ["قدرة الانفرتر", `${s.inv} kW`],
                ["نسبة التغطية", `${s.coverage}%`],
                ["الديزل الموفّر سنوياً", `${nf(s.liters)} لتر`],
                ["التوفير السنوي", `${nf(s.saving)} $`],
                ["التكلفة التقديرية", `${nf(s.capex)} $`],
                ["فترة الاسترداد", s.payback ? `${s.payback} سنة` : "—"],
                [`صافي الربح خلال ${YEARS} سنة`, `${nf(s.net)} $`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2 border-b border-border/60 pb-1"><dt className="text-muted-foreground">{k}</dt><dd className="font-bold tabular-nums">{v}</dd></div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      {rec && (
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
          <p className="text-[11px] font-bold text-primary">المنظومة المناسبة لك</p>
          <p className="mt-1 text-base font-black">منظومة هجينة تجارية {nf(rec.kwp, 1)} kWp</p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
            <div className="rounded-md bg-background p-2.5">الانفرتر<br /><b>Deye {invPkg(rec.inv)} kW{invPkg(rec.inv) >= 20 ? " — 3 فاز" : ""}</b></div>
            <div className="rounded-md bg-background p-2.5">الألواح<br /><b>Suntech — {Math.ceil((rec.kwp * 1000) / 720)} لوح 720W</b></div>
            <div className="rounded-md bg-background p-2.5">البطاريات<br /><b>ليثيوم {nf(rec.bat, 1)} kWh</b></div>
          </div>
          {onBuy && (
            <button type="button" onClick={() => onBuy(kw.map((v, h) => `${h}: ${Math.round(v * 100) / 100}`).join("\n"))} className="mt-4 w-full rounded-md bg-energy px-6 py-3 text-sm font-black text-energy-foreground sm:w-auto">
              طلب عرض سعر رسمي لهذه المنظومة
            </button>
          )}
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">الأرقام تقديرية: {PSH} ساعات ذروة شمسية، {KWH_PER_L} kWh لكل لتر ديزل، وأسعار معدات متوسطة. السعر النهائي يُحدد في عرض السعر.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setDone(false)} className="rounded-md border border-border px-4 py-2 text-xs font-bold">تعديل البيانات</button>
        {onSales && <button type="button" onClick={onSales} className="rounded-md border border-border px-4 py-2 text-xs font-bold">تواصل مع فريق أكتس</button>}
      </div>
    </div>
  );
}

/** دراسة جدوى لمنظومة جاهزة حدد العميل سعرها — بلا طلب عرض سعر. */
export function EcoSystemStudy({ onSales }: { onSales?: () => void }) {
  const [f, setF] = useState({ panel: "", panelW: "", panelN: "", inv: "", invKw: "", invN: "", bat: "", batKwh: "", batN: "", cost: "", price: "1.1" });
  const [done, setDone] = useState(false);
  const [lm, setLm] = useState<"none" | "loads" | "diesel">("none");
  const [hrs, setHrs] = useState<string[]>(() => Array(24).fill(""));
  const [total, setTotal] = useState("");
  const [one, setOne] = useState("");
  const [showReport, setShowReport] = useState(false);
  const n = (v: string) => Math.max(0, Number(v) || 0);
  const kwp = (n(f.panelW) * n(f.panelN)) / 1000;
  const invKw = n(f.invKw) * n(f.invN);
  const batKwh = n(f.batKwh) * n(f.batN);
  const capex = n(f.cost);
  const dp = n(f.price);
  const ok = f.panel.trim() && kwp > 0 && f.inv.trim() && invKw > 0 && capex > 0;
  // الإنتاج اليومي محدود بقدرة الانفرتر
  const dailyKwh = Math.min(kwp, invKw * 1.3) * PSH * PR;
  const yearKwh = dailyKwh * 365;
  // توزيع الإجمالي اليومي بنمط واقعي: ساعات النهار ضعف الليل
  const spread = (t: number) => { const w = Array.from({ length: 24 }, (_, h) => (DAY(h) ? 2 : 1)); const s = w.reduce((a, b) => a + b, 0); return w.map((x) => String(Math.round((t * x / s) * 100) / 100)); };
  const loadKw = hrs.map((v) => n(v) * (lm === "diesel" ? KWH_PER_L : 1));
  const loadDay = loadKw.reduce((a, b) => a + b, 0);
  const useLoads = lm !== "none" && loadDay > 0;
  let covered = dailyKwh;
  if (useLoads) {
    const sun = Array.from({ length: 24 }, (_, h) => (h >= 6 && h < 18 ? Math.sin(((h - 6 + 0.5) / 12) * Math.PI) : 0));
    const ss = sun.reduce((a, b) => a + b, 0);
    let direct = 0, excess = 0;
    sun.forEach((s, h) => { const p = (dailyKwh * s) / ss; direct += Math.min(p, (loadKw[h] ?? 0)); excess += Math.max(0, p - (loadKw[h] ?? 0)); });
    const night = loadDay - direct;
    covered = direct + Math.min(excess * 0.9, batKwh * DOD, night);
  }
  const coverage = useLoads ? Math.round((covered / loadDay) * 100) : null;
  const liters = Math.round((covered * 365) / KWH_PER_L);
  const saving = Math.round(liters * dp * 1.1);
  let cum = -capex; let payback: number | null = null;
  const rows: { y: number; cum: number }[] = [];
  for (let y = 1; y <= YEARS; y++) {
    const net = saving * Math.pow(1 - DEG, y - 1) - capex * OM;
    const prev = cum; cum += net; rows.push({ y, cum: Math.round(cum) });
    if (payback === null && prev < 0 && cum >= 0 && net > 0) payback = y - 1 + Math.abs(prev) / net;
  }
  // الأحمال للتقرير: أحمال العميل إن وُجدت، وإلا حمل افتراضي يساوي إنتاج المنظومة اليومي
  const reportKw = useLoads ? loadKw : spread(Math.max(1, dailyKwh)).map(Number);
  const sys: CustomSystem = { panelName: f.panel, panelW: n(f.panelW), panels: n(f.panelN), invName: f.inv, invKw: n(f.invKw), invN: n(f.invN), batName: f.bat, batUnit: n(f.batKwh), batN: n(f.batN), capex };
  const roi = capex > 0 ? Math.round((cum / capex) * 100) : 0;
  const field = (k: keyof typeof f, label: string, ph: string, num = false, opt = false) => (
    <label className="grid gap-1">
      <span className="text-xs font-bold">{label}{opt && <span className="text-muted-foreground"> (اختياري)</span>}</span>
      <input inputMode={num ? "decimal" : "text"} value={f[k]} placeholder={ph} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
    </label>
  );

  if (!done) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (ok) setDone(true); }} className="rounded-lg border border-border bg-muted/35 p-5">
        <p className="text-sm font-black">بيانات المنظومة</p>
        <p className="mt-1 text-xs text-muted-foreground">اكتب مكونات منظومتك الجاهزة وتكلفتها لنحسب جدواها الاقتصادية.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {field("panel", "اسم اللوح", "Suntech")}
          {field("panelW", "قدرة اللوح (W)", "720", true)}
          {field("panelN", "عدد الألواح", "20", true)}
          {field("inv", "اسم الانفرتر", "Deye")}
          {field("invKw", "قدرة الانفرتر (kW)", "12", true)}
          {field("invN", "عدد الانفرترات", "1", true)}
          {field("bat", "اسم البطارية", "Pylontech", false, true)}
          {field("batKwh", "سعة البطارية (kWh)", "5", true, true)}
          {field("batN", "عدد البطاريات", "2", true, true)}
          {field("cost", "تكلفة المنظومة ($)", "10000", true)}
          {field("price", "سعر لتر الديزل ($)", "1.1", true)}
        </div>
        <div className="mt-5 rounded-md border border-border bg-background p-4">
          <p className="text-xs font-black">بيانات الأحمال <span className="font-normal text-muted-foreground">(اختياري — لحساب التغطية والتوفير الفعلي)</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {([["none", "بدون"], ["loads", "بيانات الأحمال (kW)"], ["diesel", "بيانات الديزل (لتر/ساعة)"]] as const).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setLm(k)} className={`rounded-md border px-3 py-1.5 text-xs font-bold ${lm === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{l}</button>
            ))}
          </div>
          {lm !== "none" && (
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1"><span className="text-xs font-bold">الإجمالي ليوم واحد ({lm === "diesel" ? "لتر/يوم" : "kWh/يوم"})</span>
                  <input inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} placeholder={lm === "diesel" ? "120" : "400"} className="w-36 rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
                <button type="button" disabled={!n(total)} onClick={() => setHrs(spread(n(total)))} className="rounded-md bg-skyline px-3 py-2 text-xs font-bold text-skyline-foreground disabled:opacity-50">توزيع على الـ 24 ساعة</button>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className="grid gap-1"><span className="text-xs font-bold">قيمة واحدة لكل ساعة ({lm === "diesel" ? "لتر/ساعة" : "kW"})</span>
                  <input inputMode="decimal" value={one} onChange={(e) => setOne(e.target.value)} className="w-36 rounded-md border border-border bg-background px-3 py-2 text-sm" /></label>
                <button type="button" disabled={!n(one)} onClick={() => setHrs(Array(24).fill(one))} className="rounded-md border border-border px-3 py-2 text-xs font-bold disabled:opacity-50">اعتماد نفس القيمة لكل الساعات</button>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                {hrs.map((v, h) => (
                  <label key={h} className="grid gap-0.5 text-[10px] text-muted-foreground">{String(h).padStart(2, "0")}:00
                    <input inputMode="decimal" value={v} onChange={(e) => setHrs(hrs.map((x, i) => (i === h ? e.target.value : x)))} className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground" /></label>
                ))}
              </div>
            </div>
          )}
        </div>
        <button type="submit" disabled={!ok} className="mt-4 w-full rounded-md bg-skyline px-6 py-3 text-sm font-bold text-skyline-foreground disabled:opacity-50 sm:w-auto">احسب الجدوى الاقتصادية</button>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-muted/35 p-4 text-sm">
        <p className="font-black">منظومتك</p>
        <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-4">
          <div>الألواح<br /><b>{f.panel} — {f.panelN} × {f.panelW}W = {nf(kwp, 2)} kWp</b></div>
          <div>الانفرتر<br /><b>{f.inv} — {f.invN} × {f.invKw} kW</b></div>
          <div>البطاريات<br /><b>{batKwh > 0 ? `${f.bat} — ${f.batN} × ${f.batKwh} kWh` : "بدون"}</b></div>
          <div>التكلفة<br /><b className="tabular-nums">{nf(capex)} $</b></div>
        </div>
      </div>
      <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
        <p className="text-sm font-black">نتائج الجدوى الاقتصادية</p>
        <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
          {[
            ["الإنتاج اليومي المتوقع", `${nf(dailyKwh, 1)} kWh`],
            ["الإنتاج السنوي", `${nf(yearKwh)} kWh`],
            ...(useLoads ? [["الحمل اليومي", `${nf(loadDay, 1)} kWh`], ["نسبة تغطية الحمل", `${coverage}%`]] : []),
            ["الديزل الموفّر سنوياً", `${nf(liters)} لتر`],
            ["التوفير السنوي", `${nf(saving)} $`],
            ["فترة الاسترداد", payback ? `${Math.round(payback * 10) / 10} سنة` : "—"],
            [`صافي الربح خلال ${YEARS} سنة`, `${nf(cum)} $`],
            ["العائد على الاستثمار", `${roi}%`],
            ["تكلفة الواط", kwp > 0 ? `${nf(capex / (kwp * 1000), 2)} $/W` : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2 border-b border-border/60 pb-1"><dt className="text-muted-foreground">{k}</dt><dd className="font-bold tabular-nums">{v}</dd></div>
          ))}
        </dl>
        <div className="mt-4 grid grid-cols-5 gap-1 text-center text-[10px] sm:grid-cols-10">
          {rows.filter((r) => r.y % 5 === 0 || r.y <= 5).map((r) => (
            <div key={r.y} className={`rounded p-1 ${r.cum >= 0 ? "bg-energy/15" : "bg-muted"}`}>سنة {r.y}<br /><b className="tabular-nums">{nf(r.cum)}</b></div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">الأرقام تقديرية: {PSH} ساعات ذروة شمسية، نسبة أداء {PR * 100}%، {KWH_PER_L} kWh لكل لتر ديزل، وتدهور سنوي {DEG * 100}%.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setShowReport(true)} className="inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-xs font-black text-primary-foreground"><FileText className="size-4" /> فتح تقرير الدراسة الاقتصادية</button>
        <button type="button" onClick={() => setDone(false)} className="rounded-md border border-border px-4 py-2 text-xs font-bold">تعديل البيانات</button>
        <button type="button" onClick={() => setShowReport(true)} className="inline-flex items-center gap-2 rounded-md bg-navy px-5 py-2.5 text-xs font-black text-primary-foreground"><FileText className="size-4" /> فتح تقرير الدراسة الاقتصادية</button>
        {onSales && <button type="button" onClick={onSales} className="rounded-md border border-border px-4 py-2 text-xs font-bold">تواصل مع فريق أكتس</button>}
      </div>
      {showReport && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-navy/80 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <FileText className="size-4 shrink-0 text-brand" />
              <span className="flex-1 truncate text-xs font-black text-navy lg:text-sm">تقرير دراسة الجدوى الاقتصادية — ACTES</span>
              <button type="button" onClick={() => setShowReport(false)} aria-label="إغلاق" className="grid size-7 place-items-center rounded-full bg-muted text-navy transition hover:bg-border"><X className="size-4" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-muted p-2 sm:p-4">
              <EcoReport kw={reportKw} price={dp} system={sys} onEdit={() => { setShowReport(false); setDone(false); }} onSales={onSales} />
            </div>
          </div>
        </div>,
        document.body,
      )}
      {showReport && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col bg-navy/80 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true">
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <FileText className="size-4 shrink-0 text-brand" />
              <span className="flex-1 truncate text-xs font-black text-navy lg:text-sm">تقرير دراسة الجدوى الاقتصادية — ACTES</span>
              <button type="button" onClick={() => setShowReport(false)} aria-label="إغلاق" className="grid size-7 place-items-center rounded-full bg-muted text-navy transition hover:bg-border"><X className="size-4" /></button>
            </div>
            <div className="flex-1 overflow-auto bg-muted p-2 sm:p-4">
              <EcoReport kw={reportKw} price={dp} system={sys} onEdit={() => { setShowReport(false); setDone(false); }} onSales={onSales} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
