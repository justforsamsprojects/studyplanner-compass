import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { role?: "aluno" | "professor" } =>
    s["role"] === "aluno" || s["role"] === "professor" ? { role: s["role"] } : {},
  head: () => ({
    meta: [
      { title: "Entrar — StudyPlanner" },
      { name: "description", content: "Entre ou crie sua conta de aluno ou professor no StudyPlanner." },
      { property: "og:title", content: "Entrar — StudyPlanner" },
      { property: "og:description", content: "Acesse seu planejador de estudos de qualquer aparelho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "criar">(search.role ? "criar" : "entrar");
  const [role, setRole] = useState<"aluno" | "professor">(search.role ?? "aluno");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "criar") {
        if (!name.trim()) { toast.error("Informe seu nome."); return; }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { name: name.trim(), role } },
        });
        if (error) { toast.error(error.message); return; }
        if (!data.session) { toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail."); setMode("entrar"); return; }
        navigate({ to: role === "aluno" ? "/aluno/rotina" : "/professor" });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { toast.error("E-mail ou senha incorretos."); return; }
        const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
        navigate({ to: p?.role === "professor" ? "/professor" : "/aluno/rotina" });
      }
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
          <h1 className="text-2xl font-bold text-foreground">{mode === "entrar" ? "Entrar" : "Criar conta"}</h1>
          <form onSubmit={submit} className="space-y-4">
            {mode === "criar" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Eu sou</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant={role === "aluno" ? "default" : "secondary"} onClick={() => setRole("aluno")}>Aluno</Button>
                    <Button type="button" variant={role === "professor" ? "default" : "secondary"} onClick={() => setRole("professor")}>Professor</Button>
                  </div>
                </div>
              </>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "entrar" ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <button
            className="w-full text-center text-sm text-primary hover:underline"
            onClick={() => setMode(mode === "entrar" ? "criar" : "entrar")}
          >
            {mode === "entrar" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
