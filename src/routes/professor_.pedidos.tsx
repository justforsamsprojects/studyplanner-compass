import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, professorNav } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useHelpRequests, useTeacherSubjects } from "@/lib/storage";

export const Route = createFileRoute("/professor_/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos de ajuda — StudyPlanner" },
      { name: "description", content: "Responda os pedidos de ajuda dos alunos das suas disciplinas." },
      { property: "og:title", content: "Pedidos de ajuda — StudyPlanner" },
      { property: "og:description", content: "Pedidos de ajuda recebidos nas suas disciplinas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfessorPedidosPage,
});

function ProfessorPedidosPage() {
  const [teacherSubjects] = useTeacherSubjects();
  const [requests, setRequests] = useHelpRequests();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const codes = new Set(teacherSubjects.map((t) => t.code));
  const list = requests
    .filter((r) => codes.has(r.subjectCode))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const reply = (id: string) => {
    const text = (drafts[id] ?? "").trim();
    if (!text) { toast.error("Escreva uma resposta."); return; }
    setRequests(requests.map((r) => (r.id === id ? { ...r, reply: text, status: "respondido" } : r)));
    toast.success("Pedido marcado como respondido.");
  };

  return (
    <AppShell
      nav={professorNav}
      badge="Professor"
      title="Pedidos de ajuda"
      subtitle="Você vê apenas a mensagem e o resumo que o aluno escolheu compartilhar."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos recebidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido de ajuda nas suas disciplinas.</p>
          ) : (
            list.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{r.subjectName}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "respondido" ? "bg-success/15 text-success" : "bg-brand-soft text-primary"
                    }`}
                  >
                    {r.status === "respondido" ? "Respondido" : "Enviado"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-foreground">{r.message}</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>Horas planejadas: {r.summary.plannedHours}h</li>
                  <li>Horas estudadas: {r.summary.studiedHours}h / {r.summary.neededHours}h</li>
                  <li>Alertas: {r.summary.alerts.length ? r.summary.alerts.join("; ") : "nenhum"}</li>
                </ul>
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={drafts[r.id] ?? r.reply ?? ""}
                    onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                    placeholder="Escreva sua resposta"
                  />
                  <Button size="sm" onClick={() => reply(r.id)}>
                    Responder e marcar como respondido
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
