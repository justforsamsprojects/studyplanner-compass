import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, alunoNav } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpStatusBadge, HelpThread } from "@/components/HelpThread";
import { useHelpRequests } from "@/lib/storage";
import { hasTeacherReply } from "@/lib/help";

export const Route = createFileRoute("/_authenticated/aluno/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — StudyPlanner" },
      { name: "description", content: "Acompanhe seus pedidos de ajuda aos professores." },
      { property: "og:title", content: "Meus pedidos — StudyPlanner" },
      { property: "og:description", content: "Status e conversas dos pedidos de ajuda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PedidosPage,
});

function PedidosPage() {
  const [requests, setRequests] = useHelpRequests();
  const list = requests.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <AppShell nav={alunoNav} badge="Aluno" title="Meus pedidos" subtitle="Pedidos de ajuda enviados aos professores.">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pedidos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum pedido ainda. Use “Pedir ajuda” em uma disciplina adicionada por código.
            </p>
          ) : (
            list.map((r) => {
              const replied = hasTeacherReply(r);
              return (
                <div key={r.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{r.subjectName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.anonymous || !r.studentName ? "Enviado de forma anônima" : `Enviado como ${r.studentName}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <HelpStatusBadge r={r} />
                      {!replied ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setRequests(requests.filter((x) => x.id !== r.id));
                            toast.success("Pedido cancelado.");
                          }}
                        >
                          Cancelar pedido
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <HelpThread
                    r={r}
                    viewer="aluno"
                    studentLabel="Você"
                    showClose={replied}
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
