import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, alunoNav } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useBlocks, useSessions, useSubjects } from "@/lib/storage";
import { DAY_NAMES } from "@/lib/types";
import { formatDate, generatePlan, isPastSession, toISO, weekDates } from "@/lib/planner";

export const Route = createFileRoute("/aluno/plano")({
  head: () => ({
    meta: [
      { title: "Plano semanal — StudyPlanner" },
      {
        name: "description",
        content: "Sessões de estudo de 1 hora distribuídas automaticamente nas suas janelas livres.",
      },
      { property: "og:title", content: "Plano semanal — StudyPlanner" },
      { property: "og:description", content: "Calendário da semana com as sessões de estudo geradas." },
    ],
  }),
  component: PlanoPage,
});

function PlanoPage() {
  const [blocks] = useBlocks();
  const [subjects] = useSubjects();
  const [sessions, setSessions] = useSessions();

  const dates = weekDates();
  const hasPlan = sessions.length > 0;

  const gerar = () => {
    if (subjects.length === 0) { toast.error("Cadastre disciplinas antes de gerar o plano."); return; }
    // preserva concluídas e sessões que já passaram; descarta futuras pendentes
    const kept = sessions.filter((s) => s.done || isPastSession(s));
    const plan = generatePlan(blocks, subjects, kept);
    setSessions([...kept, ...plan]);
    if (plan.length === 0) { toast.info("Nenhuma nova sessão necessária ou sem janelas livres."); return; }
    toast.success(`${plan.length} sessões geradas.`);
  };

  const toggle = (id: string) =>
    setSessions(sessions.map((s) => (s.id === id ? { ...s, done: !s.done } : s)));

  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "Disciplina";
  const done = sessions.filter((s) => s.done).length;

  return (
    <AppShell
      nav={alunoNav}
      badge="Aluno"
      title="Plano semanal"
      subtitle={
        hasPlan
          ? `${done} de ${sessions.length} sessões concluídas · máximo de 3 horas de estudo por dia`
          : "Gere um plano com sessões de 1 hora nas suas janelas livres entre 7h e 22h."
      }
      actions={
        <Button onClick={gerar} variant={hasPlan ? "secondary" : "default"}>
          {hasPlan ? "Regerar plano" : "Gerar plano"}
        </Button>
      }
    >
      {!hasPlan ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum plano gerado ainda. Clique em “Gerar plano” para distribuir as sessões desta
              semana.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dates.map((date, i) => {
            const iso = toISO(date);
            const daySessions = sessions
              .filter((s) => s.date === iso)
              .sort((a, b) => a.hour - b.hour);
            return (
              <Card key={iso} className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    {DAY_NAMES[i]}
                    <span className="ml-2 font-normal text-muted-foreground">{formatDate(iso)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {daySessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem sessões.</p>
                  ) : (
                    daySessions.map((s) => (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          s.done ? "border-success/40 bg-success/10" : "border-border bg-card"
                        }`}
                      >
                        <Checkbox checked={s.done} onCheckedChange={() => toggle(s.id)} />
                        <span>
                          <span
                            className={`block text-sm font-medium ${
                              s.done ? "text-muted-foreground line-through" : "text-foreground"
                            }`}
                          >
                            {subjectName(s.subjectId)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {s.hour}h – {s.hour + 1}h
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
