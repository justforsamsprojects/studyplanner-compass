import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, alunoNav } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useHelpRequests } from "@/lib/storage";

export const Route = createFileRoute("/aluno/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus pedidos — StudyPlanner" },
      { name: "description", content: "Acompanhe seus pedidos de ajuda aos professores." },
      { property: "og:title", content: "Meus pedidos — StudyPlanner" },
      { property: "og:description", content: "Status e respostas dos pedidos de ajuda." },
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
            list.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold text-foreground">{r.subjectName}</p>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "respondido" ? "bg-success/15 text-success" : "bg-brand-soft text-primary"
                      }`}
                    >
                      {r.status === "respondido" ? "Respondido" : "Enviado"}
                    </span>
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
                  </div>
                </div>
                <p className="mt-2 text-sm text-foreground">{r.message}</p>
                {r.reply ? (
                  <div className="mt-3 rounded-lg bg-brand-soft p-3 text-sm">
                    <p className="font-medium text-primary">Resposta do professor</p>
                    <p className="text-foreground">{r.reply}</p>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
