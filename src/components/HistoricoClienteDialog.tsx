import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useHistoricoCliente } from "@/hooks/useSupabaseData";
import { formaLabel } from "@/components/ConcluirAgendamentoDialog";
import { format, parseISO } from "date-fns";

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

  const validos = hist.filter((a: any) => a.status !== "cancelado");
  const totalGasto = validos.reduce((s: number, a: any) => s + Number(a.preco) + Number(a.valor_extra || 0), 0);
  const ultima = validos[0];

  return (
    <Dialog open={!!cliente} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Histórico — {cliente?.nome}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Visitas</p>
            <p className="text-lg font-semibold text-foreground">{validos.length}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Total gasto</p>
            <p className="text-lg font-semibold text-primary">R$ {totalGasto.toFixed(2)}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Última visita</p>
            <p className="text-lg font-semibold text-foreground">
              {ultima ? format(parseISO(ultima.data), "dd/MM/yy") : "—"}
            </p>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto rounded-lg border border-border">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">Carregando...</p>
          ) : hist.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Nenhum atendimento registrado.</p>
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
                {hist.map((a: any) => (
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
