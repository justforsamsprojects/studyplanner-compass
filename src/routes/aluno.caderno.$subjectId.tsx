import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, FileText, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, alunoNav } from "@/components/AppShell";
import { NotebookEditor } from "@/components/NotebookEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { uid, useNotebookDocs, useSubjects } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/aluno/caderno/$subjectId")({
  validateSearch: (s: Record<string, unknown>): { doc?: string } =>
    typeof s["doc"] === "string" ? { doc: s["doc"] } : {},
  head: () => ({
    meta: [
      { title: "Caderno de estudos — StudyPlanner" },
      { name: "description", content: "Caderno privado da disciplina com documentos e editor de texto rico." },
      { property: "og:title", content: "Caderno de estudos — StudyPlanner" },
      { property: "og:description", content: "Anotações privadas por disciplina, salvas automaticamente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CadernoPage,
});

function CadernoPage() {
  const { subjectId } = Route.useParams();
  const { doc: selectedId } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [subjects, , subjectsReady] = useSubjects();
  const [docs, setDocs, docsReady] = useNotebookDocs();
  const [rename, setRename] = useState<{ id: string; title: string } | null>(null);

  const subject = subjects.find((s) => s.id === subjectId);
  const mine = docs
    .filter((d) => d.subjectId === subjectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const current = mine.find((d) => d.id === selectedId) ?? mine[0];

  const select = (id: string) => navigate({ search: { doc: id }, replace: true });

  const create = () => {
    const d = {
      id: uid(),
      subjectId,
      title: `Documento ${mine.length + 1}`,
      content: "",
      updatedAt: new Date().toISOString(),
    };
    setDocs((prev) => [...prev, d]);
    select(d.id);
  };

  const remove = (id: string) => {
    if (!window.confirm("Excluir este documento?")) return;
    setDocs((prev) => prev.filter((d) => d.id !== id));
    toast.success("Documento excluído.");
  };

  const saveRename = () => {
    if (!rename) return;
    const t = rename.title.trim();
    if (!t) { toast.error("Informe um nome."); return; }
    setDocs((prev) => prev.map((d) => (d.id === rename.id ? { ...d, title: t } : d)));
    setRename(null);
  };

  const saveContent = (id: string, html: string) =>
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, content: html, updatedAt: new Date().toISOString() } : d)),
    );

  if (subjectsReady && !subject) {
    return (
      <AppShell nav={alunoNav} badge="Aluno" title="Caderno não encontrado">
        <Button asChild variant="secondary">
          <Link to="/aluno/disciplinas">Voltar às disciplinas</Link>
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell
      nav={alunoNav}
      badge="Aluno"
      title={`Caderno — ${subject?.name ?? ""}`}
      subtitle="Seu caderno é privado: o professor não tem acesso."
      actions={
        <>
        {current ? (
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="size-4" /> Imprimir / PDF
          </Button>
        ) : null}
        <Button asChild variant="secondary">
          <Link to="/aluno/disciplinas"><ArrowLeft className="size-4" /> Disciplinas</Link>
        </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] print:hidden">
        <Card className="h-fit">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Documentos</CardTitle>
            <Button size="sm" onClick={create}><Plus className="size-4" /> Novo</Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {docsReady && mine.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento ainda.</p>
            ) : (
              mine.map((d) => (
                <div
                  key={d.id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm",
                    current?.id === d.id ? "bg-brand-soft text-primary" : "hover:bg-secondary",
                  )}
                >
                  <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => select(d.id)}>
                    <FileText className="size-4 shrink-0" />
                    <span className="truncate font-medium">{d.title}</span>
                  </button>
                  <button aria-label={`Renomear ${d.title}`} onClick={() => setRename({ id: d.id, title: d.title })} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="size-3.5" />
                  </button>
                  <button aria-label={`Excluir ${d.title}`} onClick={() => remove(d.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <div>
          {current ? (
            <>
              <h2 className="mb-3 text-lg font-semibold text-foreground">{current.title}</h2>
              <NotebookEditor
                key={current.id}
                content={current.content}
                onSave={(html) => saveContent(current.id, html)}
              />
            </>
          ) : (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Crie um documento para começar suas anotações.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {current ? (
        <article className="notebook-prose hidden print:block">
          <h1>{current.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: current.content }} />
        </article>
      ) : null}

      <Dialog open={!!rename} onOpenChange={(o) => !o && setRename(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear documento</DialogTitle></DialogHeader>
          <Input
            value={rename?.title ?? ""}
            onChange={(e) => setRename((r) => (r ? { ...r, title: e.target.value } : r))}
            onKeyDown={(e) => e.key === "Enter" && saveRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRename(null)}>Cancelar</Button>
            <Button onClick={saveRename}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
