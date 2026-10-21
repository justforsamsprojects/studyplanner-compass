import { createFileRoute } from "@tanstack/react-router";
import { AppShell, professorNav } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpStatusBadge, HelpThread } from "@/components/HelpThread";
import { useHelpRequests, useTeacherSubjects } from "@/lib/storage";
import { displayName } from "@/lib/help";

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

  const codes = new Set(teacherSubjects.map((t) => t.code));
  const list = requests
    .filter((r) => codes.has(r.subjectCode))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AppShell
      nav={professorNav}
      badge="Professor"
      title="Pedidos de ajuda"
      subtitle="Você vê apenas o nome (se o aluno escolheu enviar), as mensagens e o resumo compartilhado."
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos recebidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido de ajuda nas suas disciplinas.</p>
          ) : (
            list.map((r) => {
              const who = displayName(r);
              return (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{r.subjectName}</p>
                      <p className="text-sm text-muted-foreground">{who}</p>
                    </div>
                    <HelpStatusBadge r={r} />
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Horas planejadas: {r.summary.plannedHours}h</li>
                    <li>Horas estudadas: {r.summary.studiedHours}h / {r.summary.neededHours}h</li>
                    <li>Alertas: {r.summary.alerts.length ? r.summary.alerts.join("; ") : "nenhum"}</li>
                  </ul>
                  <HelpThread
                    r={r}
                    viewer="professor"
                    studentLabel={who}
                    onChange={(next) => setRequests(requests.map((x) => (x.id === r.id ? next : x)))}
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
