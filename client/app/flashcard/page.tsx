"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Layers, GraduationCap, Sparkles, RotateCcw } from "lucide-react";
import { PageHeader, Segmented, Button } from "@/components/ui";
import VocabPractice from "@/components/VocabPractice";
import { getLibrary } from "@/lib/library";
import { extractJson } from "@/lib/extractJson";
import { recordActivity } from "@/lib/storage";
import {
  addVocab,
  studyBatch,
  poolStats,
  type PoolWord,
} from "@/lib/vocabPool";
import type { FlashSet } from "@/lib/types";

type Phase = "setup" | "playing" | "done";

// Bring vocab from previously-generated flashcard sets into the pool (idempotent:
// addVocab skips words already there, keeping their mastery).
function seedFromLibrary() {
  for (const it of getLibrary()) {
    if (it.feature !== "flash") continue;
    const set = extractJson<FlashSet>(it.content);
    if (set?.cards?.length) {
      addVocab(
        set.cards.map((c) => ({ word: c.word, meaning: c.meaning, ipa: c.ipa, example: c.example })),
        it.topic
      );
    }
  }
}

export default function PracticePage() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [size, setSize] = useState<10 | 15 | 20>(10);
  const [batch, setBatch] = useState<PoolWord[]>([]);
  const [lastCorrect, setLastCorrect] = useState(0);
  const [stats, setStats] = useState({ total: 0, mastered: 0, learning: 0 });

  const refresh = () => setStats(poolStats());
  useEffect(() => {
    seedFromLibrary();
    setMounted(true);
    refresh();
  }, []);

  const start = () => {
    const b = studyBatch(size);
    if (!b.length) return;
    setBatch(b);
    setLastCorrect(0);
    setPhase("playing");
    recordActivity({ feature: "flash", topic: "luyện từ" });
  };

  const finish = (correct: number) => {
    setLastCorrect(correct);
    refresh();
    setPhase("done");
  };

  if (!mounted) return null;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Luyện từ"
        subtitle="Ôn lại từ vựng đã tạo. Trả lời đúng 3 lần là “thuộc” và từ sẽ nghỉ."
        icon={<Layers size={20} />}
      />

      {stats.total === 0 ? (
        <div className="reading-surface rounded-2xl p-8 text-center">
          <GraduationCap size={30} className="mx-auto text-accent mb-3" />
          <p className="text-slate-300 font-medium">Kho từ đang trống</p>
          <p className="text-muted text-sm mt-1 mb-4">
            Hãy tạo một bài ở “Vocab with Essay” — từ vựng của bài sẽ tự lưu vào đây để luyện.
          </p>
          <Link href="/essay">
            <Button>
              <Sparkles size={18} /> Tạo Vocab with Essay
            </Button>
          </Link>
        </div>
      ) : phase === "setup" ? (
        <div className="glass rounded-2xl p-5">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm mb-5">
            <span className="text-slate-300">
              Tổng <span className="font-bold text-white">{stats.total}</span> từ
            </span>
            <span className="text-ok">Đã thuộc {stats.mastered}</span>
            <span className="text-accent-soft">Đang học {stats.learning}</span>
          </div>

          {stats.learning === 0 ? (
            <p className="text-muted text-sm">
              Bạn đã thuộc tất cả! Tạo thêm Vocab with Essay để có từ mới, hoặc đặt lại tiến độ bên dưới.
            </p>
          ) : (
            <>
              <div className="text-sm font-medium text-slate-300 mb-1.5">Số từ mỗi lượt</div>
              <Segmented
                value={size}
                onChange={(v) => setSize(v)}
                options={[
                  { value: 10, label: "10" },
                  { value: 15, label: "15" },
                  { value: 20, label: "20" },
                ]}
              />
              <div className="mt-5">
                <Button onClick={start}>
                  <GraduationCap size={18} /> Bắt đầu luyện
                </Button>
              </div>
            </>
          )}
        </div>
      ) : phase === "playing" ? (
        <VocabPractice words={batch} onDone={finish} />
      ) : (
        <div className="glass rounded-2xl p-6 text-center">
          <div className="text-3xl font-extrabold text-white">
            {lastCorrect}/{batch.length}
          </div>
          <p className="text-muted text-sm mt-1 mb-1">câu đúng lượt này</p>
          <p className="text-sm text-ok mb-5">Đã thuộc {stats.mastered}/{stats.total} từ</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={start} disabled={stats.learning === 0}>
              <RotateCcw size={16} /> Luyện tiếp
            </Button>
            <Button variant="ghost" onClick={() => setPhase("setup")}>
              Xong
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
