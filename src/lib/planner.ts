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

/** Horas totais necessárias para a disciplina (proporcional à dificuldade). */
export function neededHours(subject: Subject) {
  return subject.difficulty * 6;
}

/** Horas estudadas = ponto de partida do cadastro + sessões concluídas (1h cada). */
export function studiedHours(subject: Subject, sessions: StudySession[] = []) {
  const done = sessions.filter((s) => s.subjectId === subject.id && s.done).length;
  return subject.hoursStudied + done;
}

/** Horas que ainda faltam estudar. */
export function requiredHours(subject: Subject, sessions: StudySession[] = []) {
  return Math.max(0, neededHours(subject) - studiedHours(subject, sessions));
}

/** Horas que deveriam ser estudadas nesta semana. */
export function weeklyTarget(subject: Subject, sessions: StudySession[] = [], from = new Date()) {
  const remainingDays = daysUntil(subject.examDate, from);
  if (remainingDays < 0) return 0;
  const weeksLeft = Math.max(1, Math.ceil((remainingDays + 1) / 7));
  return Math.ceil(requiredHours(subject, sessions) / weeksLeft);
}

/** Sessão já passou (data anterior a hoje, ou hoje com horário já iniciado). */
export function isPastSession(s: StudySession, ref = new Date()) {
  const today = toISO(ref);
  return s.date < today || (s.date === today && s.hour <= ref.getHours());
}

/** Alertas individuais de uma disciplina. */
export function subjectAlerts(subject: Subject, sessions: StudySession[]) {
  const planejadas = sessions.filter((x) => x.subjectId === subject.id).length;
  const concluidas = sessions.filter((x) => x.subjectId === subject.id && x.done).length;
  const dias = daysUntil(subject.examDate);
  const out: { level: "alto" | "medio"; title: string; text: string }[] = [];
  if (planejadas === 0) {
    out.push({
      level: "medio",
      title: `${subject.name} sem sessões`,
      text: "Nenhuma sessão de estudo foi planejada para esta disciplina nesta semana.",
    });
  }
  if (dias >= 0 && dias < 7 && (planejadas === 0 || concluidas / planejadas < 0.5)) {
    out.push({
      level: "alto",
      title: `${subject.name}: prova em ${dias} dia(s)`,
      text: `Prova em ${formatDate(subject.examDate)} e menos de 50% das horas planejadas foram concluídas.`,
    });
  }
  return out;
}

interface Candidate {
  subject: Subject;
  remaining: number;
  priority: number;
}

/**
 * Gera sessões novas. `kept` são sessões preservadas (concluídas ou passadas):
 * ocupam horário e contam no limite diário; as concluídas já descontam horas.
 */
export function generatePlan(
  blocks: BusyBlock[],
  subjects: Subject[],
  kept: StudySession[] = [],
  ref = new Date(),
): StudySession[] {
  const dates = weekDates(ref);
  const slots = freeSlots(blocks);

  const candidates: Candidate[] = subjects
    .map((subject) => {
      const keptPending = kept.filter((k) => k.subjectId === subject.id && !k.done).length;
      return {
        subject,
        remaining: weeklyTarget(subject, kept, ref) - keptPending,
        priority: daysUntil(subject.examDate, ref),
      };
    })
    .filter((c) => c.remaining > 0 && c.priority >= 0)
    .sort((a, b) => a.priority - b.priority);

  const sessions: StudySession[] = [];

  for (let day = 0; day < 7; day++) {
    const dayDate = dates[day];
    if (!dayDate) continue;
    const iso = toISO(dayDate);
    const keptToday = kept.filter((k) => k.date === iso);
    const hours = (slots.get(day) ?? []).filter(
      (h) =>
        !keptToday.some((k) => k.hour === h) &&
        !isPastSession({ id: "", subjectId: "", date: iso, hour: h, done: false }, ref),
    );
    let placedToday = keptToday.length;
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

      sessions.push({ id: uid(), subjectId: pick.subject.id, date: iso, hour, done: false });
      pick.remaining -= 1;
      placedToday += 1;
      recent.push(pick.subject.id);
      candidates.sort((a, b) => a.priority - b.priority || b.remaining - a.remaining);
    }
  }

  return sessions;
}
