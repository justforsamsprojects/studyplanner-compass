import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Info } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, alunoNav } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBlocks, useSessions, useSubjects } from "@/lib/storage";
import { DAY_SHORT } from "@/lib/types";
import { freeHoursCount, neededHours, requiredHours, studiedHours, subjectAlerts, toISO, weekDates } from "@/lib/planner";

export const Route = createFileRoute("/_authenticated/aluno/painel")({
  head: () => ({
    meta: [
      { title: "Painel — StudyPlanner" },
      {
        name: "description",
        content: "Gráficos de horas planejadas e concluídas, distribuição por disciplina e alertas.",
      },
      { property: "og:title", content: "Painel — StudyPlanner" },
      { property: "og:description", content: "Acompanhe seu desempenho semanal de estudo." },
    ],
  }),
  component: PainelPage,
});

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface Alerta {
  level: "alto" | "medio";
  title: string;
  text: string;
}

function PainelPage() {
  const [blocks] = useBlocks();
  const [subjects] = useSubjects();
  const [sessions] = useSessions();

  const porDisciplina = subjects.map((s) => {
    const planejadas = sessions.filter((x) => x.subjectId === s.id).length;
    const concluidas = sessions.filter((x) => x.subjectId === s.id && x.done).length;
    return { name: s.name, planejadas, concluidas };
  });

  const distribuicao = porDisciplina
    .filter((d) => d.planejadas > 0)
    .map((d) => ({ name: d.name, value: d.planejadas }));

  const porDia = weekDates().map((date, i) => {
    const iso = toISO(date);
    return {
      dia: DAY_SHORT[i],
      concluidas: sessions.filter((s) => s.date === iso && s.done).length,
    };
  });

  const livres = freeHoursCount(blocks);
  const alertas: Alerta[] = [];

  const totalNecessario = subjects.reduce((acc, s) => acc + requiredHours(s, sessions), 0);
  if (subjects.length > 0 && totalNecessario > livres) {
    alertas.push({
      level: "alto",
      title: "Tempo livre insuficiente",
      text: `Você precisa de ${totalNecessario}h de estudo e tem apenas ${livres}h livres na semana. Reduza compromissos ou revise as datas.`,
    });
  }

  subjects.forEach((s) => alertas.push(...subjectAlerts(s, sessions)));

  return (
    <AppShell
      nav={alunoNav}
      badge="Aluno"
      title="Painel"
      subtitle="Somente você vê o seu desempenho."
    >
      {subjects.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            Cadastre disciplinas e gere um plano para ver seus gráficos.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {alertas.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <Info className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">Tudo sob controle</p>
                  <p className="text-sm text-muted-foreground">
                    Nenhum alerta para esta semana. Continue assim!
                  </p>
                </div>
              </div>
            ) : (
              alertas.map((a, i) => (
                <div
                  key={`${a.title}-${i}`}
                  className={`flex items-start gap-3 rounded-xl border p-4 ${
                    a.level === "alto"
                      ? "border-destructive/40 bg-destructive/10"
                      : "border-warning/50 bg-warning/15"
                  }`}
                >
                  <AlertTriangle
                    className={`mt-0.5 size-5 ${
                      a.level === "alto" ? "text-destructive" : "text-warning-foreground"
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-foreground">{a.title}</p>
                    <p className="text-sm text-muted-foreground">{a.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Horas planejadas x concluídas</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porDisciplina}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="planejadas" name="Planejadas" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="concluidas" name="Concluídas" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição do tempo na semana</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {distribuicao.length === 0 ? (
                  <p className="pt-16 text-center text-sm text-muted-foreground">
                    Gere o plano semanal para ver a distribuição.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribuicao} dataKey="value" nameKey="name" outerRadius={90} label>
                        {distribuicao.map((entry, i) => (
                          <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Horas estudadas / horas necessárias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {subjects.map((s) => (
                  <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                    <span className="font-medium text-foreground">{s.name}</span>
                    <span className="text-muted-foreground">
                      {studiedHours(s, sessions)}h / {neededHours(s)}h
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Horas concluídas por dia</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={porDia}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="concluidas"
                      name="Horas concluídas"
                      stroke="var(--chart-1)"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
