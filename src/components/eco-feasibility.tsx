import { useMemo, useState } from "react";

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

export function EcoFeasibility({ mode, onSales, onBuy }: { mode: Mode; onSales?: () => void; onBuy?: () => void }) {
  const [values, setValues] = useState<string[]>(() => Array(24).fill(""));
  const [price, setPrice] = useState("1.1");
  const [done, setDone] = useState(false);
  const filled = values.filter((v) => v.trim() !== "" && !isNaN(Number(v))).length;
  const unit = mode === "diesel" ? "لتر/ساعة" : "kW";

  const kw = useMemo(() => values.map((v) => { const n = Math.max(0, Number(v) || 0); return mode === "diesel" ? n * KWH_PER_L : n; }), [values, mode]);
  const dp = Math.max(0, Number(price) || 0);
  const scenarios = useMemo(() => compute(kw, dp), [kw, dp]);
  const daily = kw.reduce((s, v) => s + v, 0);
  const dailyL = daily / KWH_PER_L;

  if (!done) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); if (filled === 24) setDone(true); }} className="rounded-lg border border-border bg-muted/35 p-5">
        <p className="text-sm font-black">{mode === "diesel" ? "بيانات استهلاك الديزل اليومية" : "بيانات الأحمال اليومية"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "diesel" ? "اكتب استهلاك المولد من الديزل في كل ساعة باللتر — اكتب 0 للساعات التي لا يعمل فيها" : "اكتب الحمل المتوقع في كل ساعة بالكيلووات (kW) — اكتب 0 للساعات بلا أحمال"}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {values.map((v, i) => (
            <label key={i} className="grid gap-1">
              <span className="text-[11px] font-bold text-muted-foreground">{hourLabel(i)}</span>
              <div className="relative">
                <input inputMode="decimal" value={v} onChange={(e) => setValues((p) => p.map((x, j) => (j === i ? e.target.value : x)))} className="w-full rounded-md border border-border bg-background px-3 py-2 pe-14 text-sm tabular-nums" placeholder="0" />
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
      <p className="text-[11px] text-muted-foreground">الأرقام تقديرية: {PSH} ساعات ذروة شمسية، {KWH_PER_L} kWh لكل لتر ديزل، وأسعار معدات متوسطة. السعر النهائي يُحدد في عرض السعر.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setDone(false)} className="rounded-md border border-border px-4 py-2 text-xs font-bold">تعديل البيانات</button>
        {onBuy && <button type="button" onClick={onBuy} className="rounded-md bg-skyline px-4 py-2 text-xs font-bold text-skyline-foreground">طلب عرض سعر</button>}
        {onSales && <button type="button" onClick={onSales} className="rounded-md border border-border px-4 py-2 text-xs font-bold">تواصل مع فريق أكتس</button>}
      </div>
    </div>
  );
}
