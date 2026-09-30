import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/aluno")({
  component: () => <Outlet />,
});
