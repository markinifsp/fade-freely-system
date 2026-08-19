import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateAgendamentoStatus } from "@/hooks/useSupabaseData";
import { Banknote, CreditCard, QrCode, Wallet } from "lucide-react";

export const FORMAS_PAGAMENTO = [
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "pix", label: "Pix", icon: QrCode },
  { value: "credito", label: "Crédito", icon: CreditCard },
  { value: "debito", label: "Débito", icon: Wallet },
] as const;

export const formaLabel = (v?: string | null) =>
  FORMAS_PAGAMENTO.find(f => f.value === v)?.label || "Não informado";

type Ag = {
  id: string;
  preco: number | string;
  clientes?: { nome: string } | null;
  servicos?: { nome: string } | null;
} | null;

export function ConcluirAgendamentoDialog({
  agendamento,
  onOpenChange,
  onDone,
}: {
  agendamento: Ag;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
}) {
  const [forma, setForma] = useState<string>("dinheiro");
  const [extra, setExtra] = useState("");
  const [obs, setObs] = useState("");
  const updateStatus = useUpdateAgendamentoStatus();

  useEffect(() => {
    if (agendamento) { setForma("dinheiro"); setExtra(""); setObs(""); }
  }, [agendamento?.id]);

  const preco = Number(agendamento?.preco || 0);
  const extraNum = Number(String(extra).replace(",", ".")) || 0;
  const total = preco + extraNum;

  const confirmar = () => {
    if (!agendamento) return;
    updateStatus.mutate(
      {
        id: agendamento.id,
        status: "concluido",
        forma_pagamento: forma,
        valor_extra: extraNum,
        obs_pagamento: obs.trim() || null,
      },
      { onSuccess: () => { onOpenChange(false); onDone?.(); } }
    );
  };

  return (
    <Dialog open={!!agendamento} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader><DialogTitle className="font-display">Fechar atendimento</DialogTitle></DialogHeader>
        {agendamento && (
          <div className="space-y-4 pt-2">
            <div className="text-sm text-muted-foreground">
              {agendamento.clientes?.nome} • {agendamento.servicos?.nome}
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAS_PAGAMENTO.map(f => {
                  const Icon = f.icon;
                  const ativo = forma === f.value;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setForma(f.value)}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${
                        ativo
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border hover:border-primary/40 text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" /> {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Entrada extra (R$)</Label>
                <Input inputMode="decimal" placeholder="0,00" value={extra} onChange={e => setExtra(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descrição do extra</Label>
                <Input placeholder="Pomada, gorjeta..." value={obs} onChange={e => setObs(e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Serviço</span><span>R$ {preco.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Extra</span><span>R$ {extraNum.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-primary pt-1 border-t border-border">
                <span>Total</span><span>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={confirmar} disabled={updateStatus.isPending} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
              {updateStatus.isPending ? "Salvando..." : "Concluir e registrar pagamento"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
