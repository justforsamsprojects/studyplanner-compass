import { Link } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

type AppPath =
  | "/aluno/rotina"
  | "/aluno/disciplinas"
  | "/aluno/plano"
  | "/aluno/painel"
  | "/aluno/pedidos"
  | "/professor"
  | "/professor/pedidos";

interface NavItem {
  to: AppPath;
  label: string;
}

interface AppShellProps {
  nav: NavItem[];
  badge: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppShell({ nav, badge, title, subtitle, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-gradient text-primary-foreground">
              <GraduationCap className="size-5" />
            </span>
            <span className="font-display text-base font-bold text-foreground">StudyPlanner</span>
          </Link>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-primary">
            {badge}
          </span>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeOptions={{ exact: true }}
                activeProps={{ className: "bg-brand-soft text-primary" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {children}
      </main>
    </div>
  );
}

export const alunoNav: NavItem[] = [
  { to: "/aluno/rotina", label: "Minha rotina" },
  { to: "/aluno/disciplinas", label: "Disciplinas" },
  { to: "/aluno/plano", label: "Plano semanal" },
  { to: "/aluno/painel", label: "Painel" },
  { to: "/aluno/pedidos", label: "Meus pedidos" },
];

export const professorNav: NavItem[] = [
  { to: "/professor", label: "Minhas disciplinas" },
  { to: "/professor/pedidos", label: "Pedidos de ajuda" },
];
