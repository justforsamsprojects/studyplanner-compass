import { Link, createFileRoute } from "@tanstack/react-router";
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
import { readTeacherSubjects, uid, useHelpRequests, useSessions, useSubjects } from "@/lib/storage";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DIFFICULTY_LABELS, type Subject } from "@/lib/types";
import { daysUntil, formatDate, neededHours, studiedHours, subjectAlerts } from "@/lib/planner";

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

  const [requests, setRequests] = useHelpRequests();
  const [helpFor, setHelpFor] = useState<Subject | null>(null);
  const [helpMsg, setHelpMsg] = useState("");

  const summaryFor = (s: Subject) => ({
    plannedHours: sessions.filter((x) => x.subjectId === s.id).length,
    studiedHours: studiedHours(s, sessions),
    neededHours: neededHours(s),
    alerts: subjectAlerts(s, sessions).map((a) => a.title),
  });

  const sendHelp = () => {
    if (!helpFor?.code) return;
    if (!helpMsg.trim()) { toast.error("Escreva uma mensagem."); return; }
    setRequests([
      ...requests,
      {
        id: uid(),
        subjectCode: helpFor.code,
        subjectName: helpFor.name,
        message: helpMsg.trim(),
        summary: summaryFor(helpFor),
        status: "enviado",
        createdAt: new Date().toISOString(),
      },
    ]);
    setHelpFor(null);
    setHelpMsg("");
    toast.success("Pedido enviado ao professor.");
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
                          {DIFFICULTY_LABELS[s.difficulty]} · {studiedHours(s, sessions)}h estudadas / {neededHours(s)}h necessárias
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                      <Button size="sm" variant="secondary" asChild>
                        <Link to="/aluno/caderno/$subjectId" params={{ subjectId: s.id }}>Abrir caderno</Link>
                      </Button>
                      {s.code ? (
                        <Button size="sm" variant="secondary" onClick={() => { setHelpFor(s); setHelpMsg(""); }}>
                          Pedir ajuda
                        </Button>
                      ) : null}
                      <button
                        onClick={() => remove(s.id)}
                        aria-label={`Remover ${s.name}`}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      </div>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!helpFor} onOpenChange={(o) => !o && setHelpFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedir ajuda — {helpFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea value={helpMsg} onChange={(e) => setHelpMsg(e.target.value)} placeholder="Descreva sua dúvida ou dificuldade" />
            </div>
            {helpFor ? (
              <div className="rounded-lg border border-border p-3 text-sm">
                <p className="mb-1 font-medium text-foreground">Será compartilhado apenas:</p>
                {(() => {
                  const sm = summaryFor(helpFor);
                  return (
                    <ul className="space-y-1 text-muted-foreground">
                      <li>Horas planejadas: {sm.plannedHours}h</li>
                      <li>Horas estudadas: {sm.studiedHours}h / {sm.neededHours}h</li>
                      <li>Alertas: {sm.alerts.length ? sm.alerts.join("; ") : "nenhum"}</li>
                    </ul>
                  );
                })()}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setHelpFor(null)}>Cancelar</Button>
            <Button onClick={sendHelp}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
