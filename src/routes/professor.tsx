import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, professorNav } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateCode, uid, useTeacherSubjects } from "@/lib/storage";
import { formatDate, type } from "@/lib/planner";
import type { TeacherDate, TeacherDateKind } from "@/lib/types";

export const Route = createFileRoute("/professor")({
  head: () => ({
    meta: [
      { title: "Professor — StudyPlanner" },
      {
        name: "description",
        content: "Crie disciplinas com datas de provas e entregas e compartilhe o código com a turma.",
      },
      { property: "og:title", content: "Professor — StudyPlanner" },
      { property: "og:description", content: "Gerencie disciplinas e códigos de acesso da turma." },
    ],
  }),
  component: ProfessorPage,
});

function ProfessorPage() {
  const [subjects, setSubjects] = useTeacherSubjects();
  const [name, setName] = useState("");
  const [dates, setDates] = useState<TeacherDate[]>([]);
  const [kind, setKind] = useState<TeacherDateKind>("prova");
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");

  const addDate = () => {
    if (!date) return toast.error("Escolha uma data.");
    setDates([...dates, { id: uid(), kind, label: label.trim() || (kind === "prova" ? "Prova" : "Entrega"), date }]);
    setLabel("");
    setDate("");
  };

  const create = () => {
    if (!name.trim()) return toast.error("Informe o nome da disciplina.");
    if (dates.length === 0) return toast.error("Adicione ao menos uma data de prova ou entrega.");
    const code = generateCode();
    setSubjects([...subjects, { id: uid(), name: name.trim(), code, dates }]);
    setName("");
    setDates([]);
    toast.success(`Disciplina criada. Código: ${code}`);
  };

  return (
    <AppShell
      nav={professorNav}
      badge="Professor"
      title="Minhas disciplinas"
      subtitle="Compartilhe o código de 6 caracteres com a turma. Dados de desempenho dos alunos são privados."
    >
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Criar disciplina</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da disciplina</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Cálculo I" />
            </div>

            <div className="space-y-2">
              <Label>Datas de provas e entregas</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as TeacherDateKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prova">Prova</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Descrição (ex.: Prova 1)"
              />
              <div className="flex gap-2">
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Button variant="secondary" onClick={addDate} aria-label="Adicionar data">
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            {dates.length > 0 ? (
              <div className="space-y-2">
                {dates.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span>
                      {d.label} · {formatDate(d.date)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {d.kind === "prova" ? "Prova" : "Entrega"}
                      </span>
                    </span>
                    <button
                      onClick={() => setDates(dates.filter((x) => x.id !== d.id))}
                      aria-label={`Remover ${d.label}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <Button className="w-full" onClick={create}>
              Criar disciplina e gerar código
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disciplinas criadas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma disciplina criada ainda.</p>
            ) : (
              subjects.map((s) => (
                <div key={s.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-foreground">{s.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-brand-soft px-3 py-1 font-mono text-sm font-bold tracking-widest text-primary">
                        {s.code}
                      </span>
                      <button
                        onClick={() => setSubjects(subjects.filter((x) => x.id !== s.id))}
                        aria-label={`Remover ${s.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {s.dates.map((d) => (
                      <li key={d.id}>
                        {d.kind === "prova" ? "Prova" : "Entrega"}: {d.label} — {formatDate(d.date)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
