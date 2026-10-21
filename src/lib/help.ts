import type { HelpMessage, HelpRequest } from "./types";
import { uid } from "./storage";

/** Mensagens em ordem, convertendo pedidos do formato antigo. */
export function messagesOf(r: HelpRequest): HelpMessage[] {
  if (r.messages) return r.messages;
  const list: HelpMessage[] = [];
  if (r.message) list.push({ id: `${r.id}-m`, author: "aluno", text: r.message, createdAt: r.createdAt });
  if (r.reply) list.push({ id: `${r.id}-r`, author: "professor", text: r.reply, createdAt: r.createdAt });
  return list;
}

export type HelpState = "aguardando" | "respondido" | "encerrado";

export function stateOf(r: HelpRequest): HelpState {
  if (r.closed || r.status === "encerrado") return "encerrado";
  const msgs = messagesOf(r);
  return msgs[msgs.length - 1]?.author === "professor" ? "respondido" : "aguardando";
}

export const STATE_LABELS: Record<HelpState, string> = {
  aguardando: "Aguardando professor",
  respondido: "Respondido",
  encerrado: "Encerrado",
};

export const STATE_CLASSES: Record<HelpState, string> = {
  aguardando: "bg-brand-soft text-primary",
  respondido: "bg-success/15 text-success",
  encerrado: "bg-muted text-muted-foreground",
};

export function hasTeacherReply(r: HelpRequest) {
  return messagesOf(r).some((m) => m.author === "professor");
}

export function addMessage(r: HelpRequest, author: HelpMessage["author"], text: string): HelpRequest {
  const messages = [...messagesOf(r), { id: uid(), author, text, createdAt: new Date().toISOString() }];
  return { ...r, messages, status: author === "professor" ? "respondido" : "aguardando" };
}

export function closeRequest(r: HelpRequest): HelpRequest {
  return { ...r, messages: messagesOf(r), closed: true, status: "encerrado" };
}

export function displayName(r: HelpRequest) {
  return r.anonymous || !r.studentName ? "Aluno anônimo" : r.studentName;
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
