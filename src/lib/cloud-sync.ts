import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { KEYS, readKey, writeKey, removeKeysSilently } from "./storage";
import type { HelpRequest, TeacherSubject } from "./types";

/**
 * Sincroniza a camada local (localStorage) com a nuvem.
 * - Dados privados do aluno (rotina, disciplinas, plano, cadernos) ficam numa linha por usuário.
 * - Disciplinas do professor e pedidos de ajuda ficam em tabelas compartilhadas.
 */

const PRIVATE = ["blocks", "subjects", "sessions", "notebookDocs"] as const;
type PrivateName = (typeof PRIVATE)[number];

let userId: string | null = null;
let pulling = false;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
let knownHelpIds = new Set<string>();

export async function pullAll(uid: string) {
  userId = uid;
  pulling = true;
  try {
    const [{ data: ud }, { data: ts }, { data: hr }, { data: profile }] = await Promise.all([
      supabase.from("user_data").select("data").eq("user_id", uid).maybeSingle(),
      supabase.from("teacher_subjects").select("id,name,code,dates").eq("owner_id", uid),
      supabase.from("help_requests").select("id,data"),
      supabase.from("profiles").select("role").eq("id", uid).maybeSingle(),
    ]);
    if (profile?.role) writeKey(KEYS.role, profile.role);
    if (ud?.data && typeof ud.data === "object") {
      const d = ud.data as Record<string, unknown>;
      for (const name of PRIVATE) writeKey(KEYS[name], d[name] ?? []);
    } else {
      for (const name of PRIVATE) writeKey(KEYS[name], []);
    }
    writeKey(
      KEYS.teacherSubjects,
      (ts ?? []).map((t) => ({ id: t.id, name: t.name, code: t.code, dates: t.dates })),
    );
    const helps = (hr ?? []).map((h) => ({ ...(h.data as object), id: h.id }) as HelpRequest);
    knownHelpIds = new Set(helps.map((h) => h.id));
    writeKey(KEYS.helpRequests, helps);
  } finally {
    pulling = false;
  }
}

/** Atualiza só os dados compartilhados (pedidos de ajuda), ex.: ao voltar para a aba. */
export async function pullShared() {
  if (!userId) return;
  const { data: hr } = await supabase.from("help_requests").select("id,data");
  if (!hr) return;
  pulling = true;
  const helps = hr.map((h) => ({ ...(h.data as object), id: h.id }) as HelpRequest);
  knownHelpIds = new Set(helps.map((h) => h.id));
  writeKey(KEYS.helpRequests, helps);
  pulling = false;
}

export function stopSync() {
  userId = null;
  timers.forEach((t) => clearTimeout(t));
  timers.clear();
  knownHelpIds = new Set();
  removeKeysSilently();
}

export function onLocalChange(key: string) {
  if (pulling || !userId) return;
  const group = (PRIVATE as readonly string[]).some((n) => KEYS[n as PrivateName] === key)
    ? "private"
    : key;
  if (group !== "private" && key !== KEYS.teacherSubjects && key !== KEYS.helpRequests) return;
  clearTimeout(timers.get(group));
  timers.set(group, setTimeout(() => void push(group), 600));
}

async function push(group: string) {
  const uid = userId;
  if (!uid) return;
  if (group === "private") {
    const data: Record<string, unknown> = {};
    for (const name of PRIVATE) data[name] = readKey(KEYS[name], []);
    await supabase
      .from("user_data")
      .upsert({ user_id: uid, data: data as Json, updated_at: new Date().toISOString() });
    return;
  }
  if (group === KEYS.teacherSubjects) {
    const list = readKey<TeacherSubject[]>(KEYS.teacherSubjects, []);
    if (list.length) {
      const { error } = await supabase.from("teacher_subjects").upsert(
        list.map((t) => ({ id: t.id, owner_id: uid, name: t.name, code: t.code, dates: t.dates as unknown as Json })),
      );
      if (error) console.error(error);
    }
    const ids = list.map((t) => t.id);
    let del = supabase.from("teacher_subjects").delete().eq("owner_id", uid);
    if (ids.length) del = del.not("id", "in", `(${ids.map((i) => `"${i}"`).join(",")})`);
    await del;
    return;
  }
  if (group === KEYS.helpRequests) {
    const list = readKey<HelpRequest[]>(KEYS.helpRequests, []);
    for (const h of list) {
      const { id, ...rest } = h;
      const row = { data: rest as unknown as Json, updated_at: new Date().toISOString() };
      if (knownHelpIds.has(id)) {
        await supabase.from("help_requests").update(row).eq("id", id);
      } else {
        const { error } = await supabase
          .from("help_requests")
          .insert({ ...row, id, subject_code: h.subjectCode, student_id: uid });
        if (!error) knownHelpIds.add(id);
      }
    }
    const current = new Set(list.map((h) => h.id));
    const removed = [...knownHelpIds].filter((id) => !current.has(id));
    for (const id of removed) {
      await supabase.from("help_requests").delete().eq("id", id).eq("student_id", uid);
      knownHelpIds.delete(id);
    }
  }
}

/** Busca disciplina de professor pelo código (qualquer professor). */
export async function findTeacherSubjectByCode(code: string): Promise<TeacherSubject | null> {
  const { data } = await supabase
    .from("teacher_subjects")
    .select("id,name,code,dates")
    .eq("code", code)
    .maybeSingle();
  return data ? ({ ...data, dates: data.dates } as unknown as TeacherSubject) : null;
}

export async function isCodeTaken(code: string) {
  const { data } = await supabase.from("teacher_subjects").select("id").eq("code", code).maybeSingle();
  return !!data;
}
