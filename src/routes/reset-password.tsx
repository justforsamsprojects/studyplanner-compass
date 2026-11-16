import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nova senha — StudyPlanner" },
      { name: "description", content: "Defina uma nova senha para voltar a entrar no StudyPlanner." },
      { property: "og:title", content: "Nova senha — StudyPlanner" },
      { property: "og:description", content: "Crie uma nova senha para acessar seu planejador de estudos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<"checking" | "form" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === "PASSWORD_RECOVERY" || session) setState("form");
    });
    // The recovery link arrives with the session in the URL fragment; give the
    // client a moment to exchange it before deciding the link is unusable.
    const timer = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!cancelled) setState(session ? "form" : "invalid");
    }, 1000);
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { toast.error("As duas senhas não conferem."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast.error(error.message); return; }
      toast.success("Senha alterada com sucesso!");
      const { data: { user } } = await supabase.auth.getUser();
      const { data: p } = user
        ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
        : { data: null };
      navigate({ to: p?.role === "professor" ? "/professor" : "/aluno/rotina" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 p-6">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display font-bold text-foreground">StudyPlanner</span>
          </div>

          {state === "checking" ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">Abrindo seu link</h1>
              <p className="text-sm text-muted-foreground">Só um instante…</p>
            </>
          ) : state === "invalid" ? (
            <>
              <h1 className="text-2xl font-bold text-foreground">Link inválido</h1>
              <p className="text-sm text-muted-foreground">
                Este link de recuperação já foi usado ou expirou. Peça um novo para continuar.
              </p>
              <Link
                to="/auth"
                className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Solicitar um novo link
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-foreground">Criar nova senha</h1>
              <p className="text-sm text-muted-foreground">
                Escolha uma senha com pelo menos 6 caracteres.
              </p>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Repetir nova senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    required
                    minLength={6}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  Salvar nova senha
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
