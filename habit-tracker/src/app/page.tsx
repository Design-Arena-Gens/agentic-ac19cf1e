"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Habit = {
  id: string;
  name: string;
  createdAt: string;
  completions: Record<string, boolean>;
};

type WeekDay = {
  date: Date;
  label: string;
  shortLabel: string;
};

const STORAGE_KEY = "habit-tracker:v1";

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitName, setHabitName] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const week = useMemo(() => buildWeek(anchorDate), [anchorDate]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setIsReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as Habit[];
      setHabits(
        parsed.map((habit) => ({
          ...habit,
          completions: habit.completions ?? {},
        })),
      );
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }, [habits, isReady]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-12 px-6 py-16 sm:px-8">
        <header className="flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.3em] text-zinc-500">
            Focus
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Habit Tracker
          </h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Build momentum by checking in every day. Add the routines you care
            about, mark your progress, and keep an eye on the streaks that keep
            you moving.
          </p>
        </header>

        <section className="flex flex-col gap-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAnchorDate((prev) => addDays(prev, -7))}
                className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate(new Date())}
                className="rounded-full border border-transparent px-3 py-1 text-sm font-semibold text-zinc-200 transition hover:border-zinc-600 hover:text-white"
              >
                This Week
              </button>
              <button
                type="button"
                onClick={() => setAnchorDate((prev) => addDays(prev, 7))}
                className="rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
              >
                Next →
              </button>
            </div>
            <div className="text-sm text-zinc-400">{formatWeekLabel(week)}</div>
          </div>

          <form
            onSubmit={handleAddHabit}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 transition focus-within:border-zinc-600"
          >
            <label
              htmlFor="habitName"
              className="text-xs uppercase tracking-[0.2em] text-zinc-500"
            >
              New Habit
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="habitName"
                name="habitName"
                autoComplete="off"
                value={habitName}
                onChange={(event) => setHabitName(event.currentTarget.value)}
                placeholder="Write for 30 minutes"
                className="flex-1 rounded-xl border border-zinc-800 bg-black/40 px-4 py-3 text-base text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-700"
              />
              <button
                type="submit"
                className="rounded-xl bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-zinc-200 active:scale-[0.99]"
              >
                Add
              </button>
            </div>
          </form>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-[minmax(0,2fr)_repeat(7,minmax(0,1fr))_minmax(0,1fr)] items-center gap-3 text-xs uppercase tracking-[0.3em] text-zinc-500">
              <span>Habit</span>
              {week.map((day) => (
                <span
                  key={day.label}
                  className="text-center text-[0.65rem] text-zinc-500"
                >
                  {day.shortLabel}
                </span>
              ))}
              <span className="text-right">Streak</span>
            </div>

            <div className="flex flex-col gap-3">
              {habits.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/60 p-6 text-sm text-zinc-500">
                  Nothing tracked yet. Add a habit above to get started.
                </div>
              )}

              {habits.map((habit) => (
                <article
                  key={habit.id}
                  className="grid grid-cols-[minmax(0,2fr)_repeat(7,minmax(0,1fr))_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-zinc-800 bg-black/40 p-4 transition hover:border-zinc-600"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-medium text-zinc-100">
                      {habit.name}
                    </span>
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {formatHabitAge(habit.createdAt)}
                    </span>
                  </div>

                  {week.map((day) => {
                    const key = formatDateKey(day.date);
                    const checked = Boolean(habit.completions[key]);
                    const isToday = isSameDay(day.date, new Date());

                    return (
                      <button
                        key={day.label}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleCompletion(habit.id, key)}
                        className={`flex h-10 items-center justify-center rounded-full border text-sm transition ${
                          checked
                            ? "border-emerald-400/70 bg-emerald-400/20 text-emerald-200 hover:border-emerald-400 hover:bg-emerald-400/25"
                            : "border-zinc-800 bg-transparent text-zinc-600 hover:border-zinc-600 hover:text-zinc-200"
                        } ${
                          isToday
                            ? "ring-1 ring-zinc-500/50 ring-offset-2 ring-offset-zinc-900"
                            : ""
                        }`}
                      >
                        {checked ? "✓" : ""}
                      </button>
                    );
                  })}

                  <div className="flex items-center justify-end gap-2 text-sm text-zinc-400">
                    <span>{computeStreak(habit)}</span>
                    <button
                      type="button"
                      onClick={() => deleteHabit(habit.id)}
                      className="rounded-full border border-zinc-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-500 transition hover:border-red-500/40 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );

  function handleAddHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!habitName.trim()) return;

    const id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    const nextHabit: Habit = {
      id,
      name: habitName.trim(),
      createdAt: new Date().toISOString(),
      completions: {},
    };

    setHabits((prev) => [nextHabit, ...prev]);
    setHabitName("");
  }

  function toggleCompletion(habitId: string, key: string) {
    setHabits((prev) =>
      prev.map((habit) => {
        if (habit.id !== habitId) return habit;
        const current = Boolean(habit.completions[key]);
        const nextCompletions = { ...habit.completions };
        if (current) {
          delete nextCompletions[key];
        } else {
          nextCompletions[key] = true;
        }
        return { ...habit, completions: nextCompletions };
      }),
    );
  }

  function deleteHabit(habitId: string) {
    setHabits((prev) => prev.filter((habit) => habit.id !== habitId));
  }
}

function buildWeek(anchor: Date): WeekDay[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(start, index);
    return {
      date,
      label: date.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
      }),
      shortLabel: date.toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
      }),
    };
  });
}

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const modifier = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + modifier);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatWeekLabel(week: WeekDay[]): string {
  if (week.length === 0) return "";
  const first = week[0].date;
  const last = week[week.length - 1].date;
  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();

  const startLabel = first.toLocaleDateString(undefined, {
    month: sameMonth ? "long" : "short",
    day: "numeric",
  });
  const endLabel = last.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
  });
  const yearLabel = sameYear
    ? first.getFullYear().toString()
    : `${first.getFullYear()} – ${last.getFullYear()}`;

  return `${startLabel} – ${endLabel}, ${yearLabel}`;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeStreak(habit: Habit): string {
  const keys = Object.keys(habit.completions);
  if (keys.length === 0) return "0 days";

  const sorted = keys.sort((a, b) => (a < b ? 1 : -1));
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const key of sorted) {
    const completionDate = new Date(key);
    completionDate.setHours(0, 0, 0, 0);
    if (formatDateKey(completionDate) !== formatDateKey(current)) {
      if (formatDateKey(addDays(current, -1)) === key) {
        current = completionDate;
        streak += 1;
        continue;
      }
      break;
    }
    streak += 1;
    current = addDays(current, -1);
  }

  return `${streak} ${streak === 1 ? "day" : "days"}`;
}

function formatHabitAge(createdAt: string): string {
  const created = new Date(createdAt);
  const diff =
    Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff <= 1 ? "Started today" : `Day ${diff}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
