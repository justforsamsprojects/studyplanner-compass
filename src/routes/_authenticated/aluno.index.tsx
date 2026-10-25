import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/aluno/")({
  beforeLoad: () => {
    throw redirect({ to: "/aluno/rotina" });
  },
});
