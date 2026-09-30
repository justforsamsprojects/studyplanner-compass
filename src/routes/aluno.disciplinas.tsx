import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, alunoNav } from "@/components/AppShell";
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
import { readTeacherSubjects, uid, useSessions, useSubjects } from "@/lib/storage";
import { DIFFICULTY_LABELS, type Subject } from "@/lib/types";
import { daysUntil, formatDate, requiredHours } from "@/lib/planner";

export const Route = createFileRoute("/aluno/disciplinas")({
  head: () => ({
    meta: [
      { title: "Disciplinas — StudyPlanner" },
      {
        name: "description",
        content: "Cadastre disciplinas com data da prova, dificuldade e horas já estudadas.",
      },
      { property: "og:title", content: "Disciplinas — StudyPlanner" },
      { property: "og:description", content: "Cadastro de disciplinas e importação por código do professor." },
    ],
  }),
  component: DisciplinasPage,
});

function DisciplinasPage() {
  const [subjects, setSubjects] = useSubjects();
  const [sessions, setSessions] = useSessions();

  const [name, setName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [difficulty, setDifficulty] = useState("2");
  const [hours, setHours] = useState("0");
  const [code, setCode] = useState("");

  const add = () => {
    if (!name.trim()) { toast.error("Informe o nome da disciplina."); return; }
    if (!examDate) { toast.error("Informe a data da prova."); return; }
    const subject: Subject = {
      id: uid(),
      name: name.trim(),
      examDate,
      difficulty: Number(difficulty) as 1 | 2 | 3,
      hoursStudied: Math.max(0, Number(hours) || 0),
    };
    setSubjects([...subjects, subject]);
    setName("");
    setExamDate("");
    setHours("0");
    toast.success("Disciplina cadastrada.");
  };

  const importByCode = () => {
    const clean = code.trim().toUpperCase();
    if (clean.length !== 6) { toast.error("O código tem 6 caracteres."); return; }
    const found = readTeacherSubjects().find((t) => t.code === clean);
    if (!found) { toast.error("Código não encontrado."); return; }
    if (subjects.some((s) => s.code === clean)) { toast.error("Disciplina já adicionada."); return; }
    const nextExam =
      found.dates
        .filter((d) => d.kind === "prova")
        .map((d) => d.date)
        .sort()[0] ??
      found.dates.map((d) => d.date).sort()[0] ??
      new Date().toISOString().slice(0, 10);
    setSubjects([
      ...subjects,
      { id: uid(), name: found.name, examDate: nextExam, difficulty: 2, hoursStudied: 0, code: clean },
    ]);
    setCode("");
    toast.success(`"${found.name}" adicionada.`);
  };

  const remove = (id: string) => {
    setSubjects(subjects.filter((s) => s.id !== id));
    setSessions(sessions.filter((s) => s.subjectId !== id));
  };

  return (
    <AppShell
      nav={alunoNav}
      badge="Aluno"
      title="Disciplinas"
      subtitle="Quanto mais próxima a prova e maior a dificuldade, mais sessões a disciplina recebe."
    >
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nova disciplina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Cálculo I" />
              </div>
              <div className="space-y-2">
                <Label>Data da prova</Label>
                <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} — {DIFFICULTY_LABELS[d as 1 | 2 | 3]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Horas já estudadas</Label>
                <Input type="number" min={0} value={hours} onChange={(e) => setHours(e.target.value)} />
              </div>
              <Button className="w-full" onClick={add}>
                Cadastrar disciplina
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adicionar pelo código do professor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="Ex.: A3K9PZ"
                className="uppercase tracking-widest"
              />
              <Button variant="secondary" className="w-full" onClick={importByCode}>
                Adicionar disciplina
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Minhas disciplinas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada ainda.</p>
            ) : (
              subjects
                .slice()
                .sort((a, b) => a.examDate.localeCompare(b.examDate))
                .map((s) => {
                  const dias = daysUntil(s.examDate);
                  return (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {s.name}
                          {s.code ? (
                            <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-primary">
                              {s.code}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Prova em {formatDate(s.examDate)} ·{" "}
                          {dias >= 0 ? `faltam ${dias} dia(s)` : "prova já passou"} ·{" "}
                          {DIFFICULTY_LABELS[s.difficulty]} · {s.hoursStudied}h estudadas ·{" "}
                          {requiredHours(s)}h restantes
                        </p>
                      </div>
                      <button
                        onClick={() => remove(s.id)}
                        aria-label={`Remover ${s.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
