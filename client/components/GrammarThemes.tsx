"use client";

// Library "by theme" view: a grid of theme (category) cards → click a theme to
// see its lessons across all levels, with search + filter + status. Reuses the
// same lesson pool; theme = lesson.category. Sub-state persists via the store.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Circle,
  CircleDot,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { ProgressBar, TextInput } from "@/components/ui";
import { useFeatureState } from "@/lib/store";
import { CATEGORY_VI, LEVELS } from "@/lib/grammar";
import {
  getCategories,
  getCategoryLessons,
  lessonStatus,
  type StoredLesson,
  type LessonStatus,
} from "@/lib/grammarLibrary";

const STATUS_ICON: Record<LessonStatus, { Icon: LucideIcon; cls: string }> = {
  new: { Icon: Circle, cls: "text-muted" },
  loaded: { Icon: CircleDot, cls: "text-[#fbbf24]" },
  learned: { Icon: CheckCircle2, cls: "text-ok" },
};

const LEVEL_NAME: Record<string, string> = {
  "A1-A2": "Sơ cấp",
  "B1-B2": "Trung cấp",
  "C1-C2": "Cao cấp",
};

const ACCENTS = ["#a78bfa", "#38bdf8", "#fb923c", "#34d399", "#f472b6", "#818cf8"];

type Filter = "all" | "todo" | "done";

export default function GrammarThemes() {
  const [openCat, setOpenCat] = useFeatureState<string | null>("grammar:openTheme", null);

  if (openCat) return <ThemeDetail category={openCat} onBack={() => setOpenCat(null)} />;
  return <ThemeGrid onOpen={(c) => setOpenCat(c)} />;
}

function ThemeGrid({ onOpen }: { onOpen: (c: string) => void }) {
  const [themes, setThemes] = useState<{ category: string; total: number; learned: number }[]>([]);
  useEffect(() => setThemes(getCategories()), []);

  return (
    <div className="animate-fade-up">
      <p className="text-center text-sm text-muted mb-4">Chọn chủ đề ngữ pháp</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {themes.map((t, i) => {
          const accent = ACCENTS[i % ACCENTS.length];
          return (
            <button
              key={t.category}
              type="button"
              onClick={() => onOpen(t.category)}
              className="glass hover-lift rounded-2xl p-4 text-left hover:shadow-glow-accent"
            >
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: accent }}
                />
                <span className="font-semibold text-white">
                  {CATEGORY_VI[t.category] ?? t.category}
                </span>
                <ChevronRight size={16} className="ml-auto text-muted" />
              </div>
              <div className="flex items-center gap-2">
                <ProgressBar value={t.learned} max={t.total} className="flex-1" />
                <span className="text-xs text-muted font-medium shrink-0">
                  {t.learned}/{t.total}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ThemeDetail({ category, onBack }: { category: string; onBack: () => void }) {
  const [lessons, setLessons] = useState<StoredLesson[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => setLessons(getCategoryLessons(category)), [category]);

  const learned = lessons.filter((l) => l.learned).length;

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lessons.filter((l) => {
      if (filter === "done" && !l.learned) return false;
      if (filter === "todo" && l.learned) return false;
      if (!needle) return true;
      return (
        l.titleVi.toLowerCase().includes(needle) ||
        l.titleEn.toLowerCase().includes(needle)
      );
    });
  }, [lessons, q, filter]);

  // Group the (filtered) lessons by level, in canonical level order.
  const groups = LEVELS.map((lvl) => ({
    level: lvl,
    items: visible.filter((l) => l.level === lvl),
  })).filter((g) => g.items.length > 0);

  const chip = (key: Filter, label: string) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
        filter === key ? "bg-accent text-white" : "glass-input text-muted hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="animate-fade-up">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-white mb-3"
      >
        <ArrowLeft size={16} /> Tất cả chủ đề
      </button>

      <h2 className="text-lg font-bold text-white mb-3">
        {CATEGORY_VI[category] ?? category}
      </h2>

      <div className="glass rounded-2xl p-3.5 mb-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-slate-300">Tiến độ chủ đề</span>
          <span className="text-accent-soft font-bold">
            {learned} / {lessons.length} bài
          </span>
        </div>
        <ProgressBar value={learned} max={lessons.length} />
      </div>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm bài học…"
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 mb-5">
        {chip("all", "Tất cả")}
        {chip("todo", "Chưa học")}
        {chip("done", "Đã học")}
      </div>

      {groups.length === 0 && (
        <p className="text-muted text-sm text-center py-8">Không có bài nào khớp bộ lọc.</p>
      )}

      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.level}>
            <h3 className="text-[12px] font-semibold text-muted uppercase tracking-wide mb-2 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-soft">{g.level}</span>
              {LEVEL_NAME[g.level]}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {g.items.map((l) => {
                const st = STATUS_ICON[lessonStatus(l)];
                return (
                  <Link key={l.id} href={`/grammar/${l.slug}`}>
                    <div className="glass hover-lift rounded-2xl p-3 hover:border-accent/70 hover:shadow-glow-accent h-full">
                      <div className="flex items-center gap-2 mb-1">
                        <st.Icon size={15} className={`${st.cls} shrink-0`} />
                        <span className="font-semibold text-white text-sm">{l.titleVi}</span>
                      </div>
                      <div className="text-xs text-accent-soft mb-1">{l.titleEn}</div>
                      <p className="text-xs text-muted leading-snug">{l.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
