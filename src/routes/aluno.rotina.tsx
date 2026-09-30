import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
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
import { loadSampleData, uid, useBlocks } from "@/lib/storage";
import { BLOCK_LABELS, DAY_NAMES, DAY_SHORT, type BlockType, type BusyBlock } from "@/lib/types";
import { freeHoursCount } from "@/lib/planner";

export const Route = createFileRoute("/aluno/rotina")({
  head: () => ({
    meta: [
      { title: "Minha rotina — StudyPlanner" },
      {
        name: "description",
        content: "Marque na grade semanal os horários já ocupados com aulas, trabalho e compromissos.",
      },
      { property: "og:title", content: "Minha rotina — StudyPlanner" },
      { property: "og:description", content: "Grade semanal de horários ocupados do aluno." },
    ],
  }),
  component: RotinaPage,
});

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6h às 23h

const TYPE_STYLES: Record<BlockType, string> = {
  aula: "bg-primary/85 text-primary-foreground",
  trabalho: "bg-chart-2/85 text-primary-foreground",
  transporte: "bg-chart-4/85 text-warning-foreground",
  compromisso: "bg-chart-5/85 text-primary-foreground",
};

function RotinaPage() {
  const [blocks, setBlocks] = useBlocks();
  const [day, setDay] = useState("0");
  const [start, setStart] = useState("8");
  const [end, setEnd] = useState("10");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<BlockType>("aula");

  const add = () => {
    const s = Number(start);
    const e = Number(end);
    if (!label.trim()) { toast.error("Dê um nome ao bloco."); return; }
    if (e <= s) { toast.error("O horário final deve ser maior que o inicial."); return; }
    const block: BusyBlock = { id: uid(), day: Number(day), start: s, end: e, label: label.trim(), type };
    setBlocks([...blocks, block]);
    setLabel("");
    toast.success("Bloco adicionado à rotina.");
  };

  const remove = (id: string) => setBlocks(blocks.filter((b) => b.id !== id));

  return (
    <AppShell
      nav={alunoNav}
      badge="Aluno"
      title="Minha rotina"
      subtitle={`Horários livres entre 7h e 22h nesta semana: ${freeHoursCount(blocks)}h`}
      actions={
        <Button
          variant="secondary"
          onClick={() => {
            loadSampleData();
            toast.success("Dados de exemplo carregados.");
          }}
        >
          Carregar dados de exemplo
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar bloco ocupado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex.: Aula de Cálculo"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as BlockType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BLOCK_LABELS).map(([value, text]) => (
                    <SelectItem key={value} value={value}>
                      {text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Dia</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, i) => (
                    <SelectItem key={name} value={String(i)}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Início</Label>
                <Select value={start} onValueChange={setStart}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>{`${h}h`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Select value={end} onValueChange={setEnd}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => h + 1).map((h) => (
                      <SelectItem key={h} value={String(h)}>{`${h}h`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={add}>
              Adicionar bloco
            </Button>

            {blocks.length > 0 ? (
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Blocos cadastrados
                </p>
                {blocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="truncate">
                      <strong className="font-medium">{b.label}</strong>
                      <span className="text-muted-foreground">
                        {" "}
                        · {DAY_SHORT[b.day]} {b.start}h–{b.end}h
                      </span>
                    </span>
                    <button
                      onClick={() => remove(b.id)}
                      aria-label={`Remover ${b.label}`}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Grade semanal (6h às 23h)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-1">
                <div />
                {DAY_SHORT.map((d) => (
                  <div key={d} className="pb-1 text-center text-xs font-semibold text-muted-foreground">
                    {d}
                  </div>
                ))}
                {HOURS.map((hour) => (
                  <Fragment key={hour}>
                    <div className="pr-2 text-right text-xs text-muted-foreground">
                      {hour}h
                    </div>
                    {DAY_SHORT.map((_, dayIndex) => {
                      const block = blocks.find(
                        (b) => b.day === dayIndex && hour >= b.start && hour < b.end,
                      );
                      const isFirst = block && block.start === hour;
                      return (
                        <div
                          key={`${hour}-${dayIndex}`}
                          className={`h-7 rounded-md px-1 text-[10px] leading-7 ${
                            block ? TYPE_STYLES[block.type] : "bg-secondary"
                          }`}
                          title={block ? `${block.label} (${BLOCK_LABELS[block.type]})` : "Livre"}
                        >
                          {isFirst ? <span className="truncate">{block!.label}</span> : null}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
