import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { HelpRequest } from "@/lib/types";
import {
  STATE_CLASSES,
  STATE_LABELS,
  addMessage,
  closeRequest,
  formatDateTime,
  messagesOf,
  stateOf,
} from "@/lib/help";

export function HelpStatusBadge({ r }: { r: HelpRequest }) {
  const s = stateOf(r);
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_CLASSES[s]}`}>{STATE_LABELS[s]}</span>;
}

/** Conversa do pedido + campo de resposta + "Encerrar pedido". */
export function HelpThread({
  r,
  viewer,
  studentLabel,
  onChange,
  showClose = true,
}: {
  r: HelpRequest;
  viewer: "aluno" | "professor";
  studentLabel: string;
  onChange: (next: HelpRequest) => void;
  showClose?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const closed = stateOf(r) === "encerrado";

  const send = () => {
    const text = draft.trim();
    if (!text) { toast.error("Escreva uma mensagem."); return; }
    onChange(addMessage(r, viewer, text));
    setDraft("");
    toast.success("Mensagem enviada.");
  };

  return (
    <div className="mt-3 space-y-3">
      <ol className="space-y-2">
        {messagesOf(r).map((m) => (
          <li
            key={m.id}
            className={`rounded-lg p-3 text-sm ${m.author === "professor" ? "bg-brand-soft" : "border border-border"}`}
          >
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {m.author === "professor" ? "Professor" : studentLabel} · {formatDateTime(m.createdAt)}
            </p>
            <p className="whitespace-pre-wrap text-foreground">{m.text}</p>
          </li>
        ))}
      </ol>
      {closed ? (
        <p className="text-sm text-muted-foreground">Pedido encerrado. Não aceita novas mensagens.</p>
      ) : (
        <div className="space-y-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Escreva sua mensagem" />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={send}>Enviar mensagem</Button>
            {showClose ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => { onChange(closeRequest(r)); toast.success("Pedido encerrado."); }}
              >
                Encerrar pedido
              </Button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
