"use client";

// Level selector — horizontal scroll carousel. The card nearest the viewport
// center is "active" (full color + scale + colored glow); the others dim and
// darken. Active updates live as you scroll. Click active → open; click a side
// card → it scrolls to center.

import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { LEVELS } from "@/lib/grammar";
import { getAllLessons } from "@/lib/grammarLibrary";

const META: Record<
  string,
  { name: string; tag: string; desc: string; grad: string; glow: string; ink: string }
> = {
  "A1-A2": {
    name: "Sơ cấp",
    tag: "A1 – A2",
    desc: "Nền tảng: danh từ, đại từ, thì cơ bản, mạo từ, giới từ.",
    grad: "linear-gradient(160deg, #efd7ff 0%, #f9c9e6 55%, #f6d3c4 100%)",
    glow: "rgba(192, 132, 252, 0.6)",
    ink: "#3b1d52",
  },
  "B1-B2": {
    name: "Trung cấp",
    tag: "B1 – B2",
    desc: "Thì hoàn thành, câu bị động, mệnh đề, câu điều kiện.",
    grad: "linear-gradient(160deg, #ffe6c2 0%, #ffd0a8 55%, #ffbfb0 100%)",
    glow: "rgba(251, 146, 60, 0.55)",
    ink: "#5a2e10",
  },
  "C1-C2": {
    name: "Cao cấp",
    tag: "C1 – C2",
    desc: "Đảo ngữ, cấu trúc nâng cao, sắc thái học thuật.",
    grad: "linear-gradient(160deg, #bfe0ff 0%, #a8e6f0 55%, #c4d0ff 100%)",
    glow: "rgba(56, 189, 248, 0.55)",
    ink: "#10324a",
  },
};

export default function GrammarCoverflow({
  onOpen,
}: {
  onOpen: (level: string) => void;
}) {
  const [counts, setCounts] = useState<Record<string, { total: number; learned: number }>>({});
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const all = getAllLessons();
    const c: Record<string, { total: number; learned: number }> = {};
    for (const lvl of LEVELS) {
      const items = all.filter((l) => l.level === lvl);
      c[lvl] = { total: items.length, learned: items.filter((l) => l.learned).length };
    }
    setCounts(c);
  }, []);

  // The card whose center is nearest the scroller's center is "active".
  useEffect(() => {
    const sc = scroller.current;
    if (!sc) return;
    let raf = 0;
    const recompute = () => {
      const center = sc.scrollLeft + sc.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const c = el.offsetLeft + el.offsetWidth / 2;
        const d = Math.abs(c - center);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recompute);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", recompute);
    recompute();
    return () => {
      sc.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", recompute);
      cancelAnimationFrame(raf);
    };
  }, []);

  const centerCard = (i: number) =>
    cardRefs.current[i]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });

  const handleClick = (i: number, lvl: string) => {
    if (i === active) onOpen(lvl);
    else centerCard(i);
  };

  return (
    <div className="animate-fade-up">
      <p className="text-center text-sm text-muted mb-2">Chọn cấp độ để bắt đầu</p>

      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-[11%] py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {LEVELS.map((lvl, i) => {
          const m = META[lvl];
          const c = counts[lvl] ?? { total: 0, learned: 0 };
          const pct = c.total > 0 ? Math.round((c.learned / c.total) * 100) : 0;
          const isActive = i === active;
          return (
            <button
              key={lvl}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              type="button"
              onClick={() => handleClick(i, lvl)}
              className={`flex-none w-[78%] snap-center flex flex-col text-left rounded-[28px] p-6 min-h-[440px] transition-all duration-300 ease-out ${
                isActive
                  ? "scale-100 opacity-100"
                  : "scale-[0.88] opacity-60 brightness-[0.6] saturate-[0.85]"
              }`}
              style={{
                background: m.grad,
                boxShadow: isActive
                  ? `0 30px 80px -16px ${m.glow}, 0 0 90px -8px ${m.glow}, inset 0 0 0 1px rgba(255,255,255,0.4)`
                  : "inset 0 0 0 1px rgba(255,255,255,0.12)",
              }}
            >
              <div
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: m.ink, opacity: 0.65 }}
              >
                {m.tag}
              </div>
              <h3
                className="font-serif font-bold text-[2.4rem] leading-[1.05] mt-2"
                style={{ color: m.ink }}
              >
                {m.name}
              </h3>
              <p className="text-[15px] mt-3 leading-relaxed" style={{ color: m.ink, opacity: 0.82 }}>
                {m.desc}
              </p>

              <div className="mt-auto pt-6" style={{ color: m.ink }}>
                <div className="flex justify-between text-sm font-bold mb-1.5">
                  <span>{c.learned}/{c.total} đã học</span>
                  <span style={{ opacity: 0.7 }}>{c.total} bài</span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(0,0,0,0.14)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${pct}%`, background: m.ink }}
                  />
                </div>
                <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold">
                  Vào học
                  <ArrowRight size={16} className={isActive ? "translate-x-0.5" : ""} />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* focus dots */}
      <div className="flex justify-center gap-2 mt-2">
        {LEVELS.map((lvl, i) => (
          <button
            key={lvl}
            type="button"
            aria-label={`Cấp ${lvl}`}
            onClick={() => centerCard(i)}
            className={`h-[7px] rounded-full transition-all ${
              i === active ? "w-6 bg-accent" : "w-[7px] bg-white/25"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
