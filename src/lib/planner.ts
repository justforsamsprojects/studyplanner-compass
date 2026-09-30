import type { BusyBlock, StudySession, Subject } from "./types";
import { uid } from "./storage";

export const DAY_START = 7;
export const DAY_END = 22; // exclusivo: última sessão começa às 21h
export const MAX_HOURS_PER_DAY = 3;
export const MAX_CONSECUTIVE = 2;

export function toISO(date: Date) {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function startOfWeek(ref = new Date()) {
  const d = new Date(ref);
  const day = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function weekDates(ref = new Date()) {
  const start = startOfWeek(ref);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function daysUntil(iso: string, from = new Date()) {
  const target = new Date(`${iso}T12:00:00`);
  const base = new Date(from);
  base.setHours(12, 0, 0, 0);
  return Math.round((target.getTime() - base.getTime()) / 86400000);
}

export function formatDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Horas livres (índice do dia 0-6 -> lista de horas iniciais) entre 7h e 22h. */
export function freeSlots(blocks: BusyBlock[]) {
  const map = new Map<number, number[]>();
  for (let day = 0; day < 7; day++) {
    const hours: number[] = [];
    for (let h = DAY_START; h < DAY_END; h++) {
      const busy = blocks.some((b) => b.day === day && h >= b.start && h < b.end);
      if (!busy) hours.push(h);
    }
    map.set(day, hours);
  }
  return map;
}

export function freeHoursCount(blocks: BusyBlock[]) {
  let total = 0;
  freeSlots(blocks).forEach((hours) => (total += hours.length));
  return total;
}

/** Horas totais necessárias até a prova, proporcionais à dificuldade. */
export function requiredHours(subject: Subject) {
  const base = subject.difficulty * 6;
  return Math.max(0, base - subject.hoursStudied);
}

/** Horas que deveriam ser estudadas nesta semana. */
export function weeklyTarget(subject: Subject, from = new Date()) {
  const remainingDays = daysUntil(subject.examDate, from);
  if (remainingDays < 0) return 0;
  const weeksLeft = Math.max(1, Math.ceil((remainingDays + 1) / 7));
  return Math.ceil(requiredHours(subject) / weeksLeft);
}

interface Candidate {
  subject: Subject;
  remaining: number;
  priority: number;
}

export function generatePlan(
  blocks: BusyBlock[],
  subjects: Subject[],
  ref = new Date(),
): StudySession[] {
  const dates = weekDates(ref);
  const slots = freeSlots(blocks);
  const todayISO = toISO(ref);

  const candidates: Candidate[] = subjects
    .map((subject) => ({
      subject,
      remaining: weeklyTarget(subject, ref),
      priority: daysUntil(subject.examDate, ref),
    }))
    .filter((c) => c.remaining > 0 && c.priority >= 0)
    .sort((a, b) => a.priority - b.priority);

  const sessions: StudySession[] = [];

  for (let day = 0; day < 7; day++) {
    const dayDate = dates[day];
    if (!dayDate) continue;
    const iso = toISO(dayDate);
    if (iso < todayISO) continue; // não planeja dias que já passaram
    const hours = slots.get(day) ?? [];
    let placedToday = 0;
    const recent: string[] = [];

    for (const hour of hours) {
      if (placedToday >= MAX_HOURS_PER_DAY) break;

      const pick = candidates
        .filter((c) => c.remaining > 0)
        .find((c) => {
          const tail = recent.slice(-MAX_CONSECUTIVE);
          const repeated =
            tail.length === MAX_CONSECUTIVE && tail.every((id) => id === c.subject.id);
          return !repeated;
        });

      if (!pick) break;

      sessions.push({
        id: uid(),
        subjectId: pick.subject.id,
        date: iso,
        hour,
        done: false,
      });
      pick.remaining -= 1;
      placedToday += 1;
      recent.push(pick.subject.id);
      candidates.sort((a, b) => a.priority - b.priority || b.remaining - a.remaining);
    }
  }

  return sessions;
}
