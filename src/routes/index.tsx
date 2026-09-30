import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, CalendarRange, GraduationCap, LineChart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRole } from "@/lib/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyPlanner — Planejador Acadêmico Inteligente" },
      {
        name: "description",
        content:
          "Monte um plano de estudo semanal a partir da sua rotina real, das disciplinas e das datas de prova, com gráficos e alertas.",
      },
      { property: "og:title", content: "StudyPlanner — Planejador Acadêmico Inteligente" },
      {
        property: "og:description",
        content: "Plano de estudo semanal automático a partir da sua rotina e das suas provas.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [, setRole] = useRole();
  const navigate = useNavigate();

  const choose = (role: "aluno" | "professor") => {
    setRole(role);
    navigate({ to: role === "aluno" ? "/aluno/rotina" : "/professor" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-soft">
            <GraduationCap className="size-6" />
          </span>
          <span className="font-display text-lg font-bold text-foreground">StudyPlanner</span>
        </div>

        <h1 className="mt-10 max-w-2xl text-4xl font-bold text-foreground sm:text-5xl">
          Planejador Acadêmico Inteligente
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Informe sua rotina real, suas disciplinas e as datas das provas. O StudyPlanner monta um
          plano de estudo semanal, acompanha seu progresso em gráficos e avisa quando o tempo está
          apertado.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Card className="border-border transition-shadow hover:shadow-soft">
            <CardContent className="flex flex-col gap-4 p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
                <BookOpen className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Sou aluno</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Monte sua rotina, cadastre disciplinas, gere o plano semanal e acompanhe seu
                  desempenho.
                </p>
              </div>
              <Button className="mt-auto" onClick={() => choose("aluno")}>
                Entrar como aluno
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border transition-shadow hover:shadow-soft">
            <CardContent className="flex flex-col gap-4 p-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-primary">
                <Users className="size-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Sou professor</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crie disciplinas com datas de provas e entregas e compartilhe o código com a
                  turma.
                </p>
              </div>
              <Button variant="secondary" className="mt-auto" onClick={() => choose("professor")}>
                Entrar como professor
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: CalendarRange, title: "Rotina real", text: "Grade de segunda a domingo, das 6h às 23h." },
            { icon: BookOpen, title: "Plano automático", text: "Sessões de 1 hora nas suas janelas livres." },
            { icon: LineChart, title: "Painel", text: "Gráficos de horas e alertas de risco." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card p-4">
              <item.icon className="size-5 text-primary" />
              <p className="mt-3 font-semibold text-foreground">{item.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
