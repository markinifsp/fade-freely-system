import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useHistoricoCliente } from "@/hooks/useSupabaseData";
import { formaLabel } from "@/components/ConcluirAgendamentoDialog";
import { format, parseISO, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";

const statusColors: Record<string, string> = {
  confirmado: "bg-info/20 text-info border-info/30",
  concluido: "bg-success/20 text-success border-success/30",
  cancelado: "bg-destructive/20 text-destructive border-destructive/30",
};

export function HistoricoClienteDialog({
  cliente,
  onOpenChange,
}: {
  cliente: { id: string; nome: string } | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: hist = [], isLoading } = useHistoricoCliente(cliente?.id);
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [servico, setServico] = useState("todos");

  const servicosDisponiveis = useMemo(
    () => Array.from(new Set(hist.map((a: any) => a.servicos?.nome).filter(Boolean))).sort(),
    [hist]
  );

  const filtrado = useMemo(
    () =>
      hist.filter((a: any) => {
        if (de && a.data < de) return false;
        if (ate && a.data > ate) return false;
        if (servico !== "todos" && a.servicos?.nome !== servico) return false;
        return true;
      }),
    [hist, de, ate, servico]
  );

  const validos = filtrado.filter((a: any) => a.status !== "cancelado");
  const totalGasto = validos.reduce((s: number, a: any) => s + Number(a.preco) + Number(a.valor_extra || 0), 0);
  const ultima = validos[0];
  const ticket = validos.length ? totalGasto / validos.length : 0;

  const hoje = new Date();
  const setRange = (start: Date, end: Date) => {
    setDe(format(start, "yyyy-MM-dd"));
    setAte(format(end, "yyyy-MM-dd"));
  };
  const limpar = () => {
    setDe("");
    setAte("");
    setServico("todos");
  };

  return (
    <Dialog open={!!cliente} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Histórico — {cliente?.nome}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">De</Label>
            <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} className="h-9 w-[140px] text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Até</Label>
            <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} className="h-9 w-[140px] text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Serviço</Label>
            <select
              value={servico}
              onChange={(e) => setServico(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground"
            >
              <option value="todos">Todos os serviços</option>
              {servicosDisponiveis.map((s: string) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={() => setRange(subDays(hoje, 29), hoje)}>
              30 dias
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setRange(startOfMonth(hoje), endOfMonth(hoje))}>
              Mês atual
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => setRange(startOfMonth(subMonths(hoje, 5)), endOfMonth(hoje))}
            >
              6 meses
            </Button>
            <Button variant="ghost" size="sm" className="h-9" onClick={limpar}>
              Limpar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Visitas</p>
            <p className="text-lg font-semibold text-foreground">{validos.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Total gasto</p>
            <p className="text-lg font-semibold text-primary">R$ {totalGasto.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="text-lg font-semibold text-foreground">R$ {ticket.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Última visita</p>
            <p className="text-lg font-semibold text-foreground">
              {ultima ? format(parseISO(ultima.data), "dd/MM/yy") : "—"}
            </p>
          </div>
        </div>

        <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-border">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : filtrado.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum atendimento no filtro selecionado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Data</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Serviço</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Barbeiro</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Pagamento</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtrado.map((a: any) => (
                  <tr key={a.id} className="border-b border-border/50">
                    <td className="p-3 whitespace-nowrap">
                      <span className="text-foreground">{format(parseISO(a.data), "dd/MM/yy")}</span>{" "}
                      <span className="text-muted-foreground">{a.hora?.substring(0, 5)}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-foreground">{a.servicos?.nome}</span>
                      <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full border ${statusColors[a.status] || ""}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{a.barbeiros?.nome}</td>
                    <td className="p-3 text-muted-foreground">
                      {a.status === "concluido" ? formaLabel(a.forma_pagamento) : "—"}
                      {Number(a.valor_extra) > 0 && (
                        <span className="block text-[10px] text-primary">
                          +R$ {Number(a.valor_extra).toFixed(2)} {a.obs_pagamento || "extra"}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold text-foreground">
                      R$ {(Number(a.preco) + Number(a.valor_extra || 0)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
