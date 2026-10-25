import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, CalendarRange, Download, GraduationCap, LineChart, Sparkles, Trash2, Upload, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearAllData, exportAllData, importAllData, loadSampleData, useRole } from "@/lib/storage";

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
  const [role] = useRole();
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setUser(null); return; }
      const { data: p } = await supabase.from("profiles").select("name").eq("id", data.user.id).maybeSingle();
      setUser({ name: p?.name || data.user.email || "" });
    };
    void load();
    const { data } = supabase.auth.onAuthStateChange(() => void load());
    return () => data.subscription.unsubscribe();
  }, []);

  const choose = (r: "aluno" | "professor") => {
    if (!user) { navigate({ to: "/auth", search: { role: r } }); return; }
    const mine = role ?? r;
    if (mine !== r) toast.info(`Sua conta é de ${mine}.`);
    navigate({ to: mine === "aluno" ? "/aluno/rotina" : "/professor" });
  };

  const sair = async () => {
    await supabase.auth.signOut();
    toast.success("Você saiu da conta.");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-16">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-gradient text-primary-foreground shadow-soft">
            <GraduationCap className="size-6" />
          </span>
          <span className="font-display text-lg font-bold text-foreground">StudyPlanner</span>
          <div className="ml-auto flex items-center gap-2 text-sm">
            {user ? (
              <>
                <span className="text-muted-foreground">Olá, {user.name}</span>
                <Button size="sm" variant="secondary" onClick={sair}>Sair</Button>
              </>
            ) : (
              <Button size="sm" onClick={() => navigate({ to: "/auth" })}>Entrar</Button>
            )}
          </div>
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

        {user ? <DataTools /> : null}
      </div>
    </div>
  );
}

function DataTools() {
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const blob = new Blob([JSON.stringify(exportAllData(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `studyplanner-dados-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    toast.success("Dados exportados");
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      importAllData(JSON.parse(await file.text()));
      toast.success("Dados importados e restaurados");
    } catch {
      toast.error("Arquivo inválido. Use um arquivo exportado pelo StudyPlanner.");
    }
  };

  return (
    <div className="mt-12 rounded-xl border border-border bg-card p-4">
      <p className="font-semibold text-foreground">Seus dados</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Faça uma cópia de tudo o que está salvo neste navegador, restaure de um arquivo ou comece do zero.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => { loadSampleData(); toast.success("Dados de exemplo carregados"); }}>
          <Sparkles className="size-4" /> Carregar dados de exemplo
        </Button>
        <Button variant="outline" onClick={doExport}>
          <Download className="size-4" /> Exportar dados
        </Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" /> Importar dados
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="text-destructive">
              <Trash2 className="size-4" /> Limpar dados
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
              <AlertDialogDescription>
                Rotina, disciplinas, plano, pedidos de ajuda, cadernos e disciplinas do professor serão apagados deste navegador. Exporte antes se quiser guardar uma cópia.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => { clearAllData(); toast.success("Dados apagados"); }}
              >
                Limpar dados
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
