import { useState, useMemo } from "react";
import { useAgendamentos, useBarbeiros, useServicos, useClientes, useCreateAgendamento, useUpdateAgendamentoStatus, useBarbearia, useBloqueiosByBarbeiroDate } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, Clock, Ban, Check, X, Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  confirmado: "bg-info/80 border-info",
  concluido: "bg-success/80 border-success",
  cancelado: "bg-destructive/40 border-destructive line-through opacity-50",
};

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fromMin = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

function generateSlots(startMin: number, endMin: number): string[] {
  const slots: string[] = [];
  for (let m = startMin; m <= endMin; m += 30) slots.push(fromMin(m));
  return slots;
}

function useBloqueiosByDate(date: string, barbeariaId: string | null) {
  return useQuery({
    queryKey: ["bloqueios-date", date, barbeariaId],
    queryFn: async () => {
      if (!barbeariaId) return [];
      const { data, error } = await supabase
        .from("barbeiro_bloqueios")
        .select("*, barbeiros!inner(barbearia_id)")
        .eq("data", date)
        .eq("barbeiros.barbearia_id", barbeariaId);
      if (error) throw error;
      return data;
    },
    enabled: !!barbeariaId,
  });
}

export default function Calendario() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filtroBarbeiro, setFiltroBarbeiro] = useState("todos");
  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const { data: agendamentos = [], isLoading } = useAgendamentos(dateStr);
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();
  const { data: clientes = [] } = useClientes();
  const { data: barbearia } = useBarbearia();
  const { barbeariaId } = useAuth();
  const { data: bloqueios = [] } = useBloqueiosByDate(dateStr, barbeariaId);
  const updateStatus = useUpdateAgendamentoStatus();
  const createAg = useCreateAgendamento();

  const [selectedAg, setSelectedAg] = useState<any>(null);
  const [newSlot, setNewSlot] = useState<{ barbeiroId: string; hora: string } | null>(null);
  const [newForm, setNewForm] = useState({ clienteId: "", servicoId: "" });

  const { data: bloqForForm = [] } = useBloqueiosByBarbeiroDate(newSlot?.barbeiroId, dateStr);
  const horaBloqueada = newSlot ? bloqForForm.some((b: any) => {
    if (b.dia_inteiro) return true;
    const s = b.hora_inicio?.substring(0, 5) || "00:00";
    const e = b.hora_fim?.substring(0, 5) || "23:59";
    return newSlot.hora >= s && newSlot.hora < e;
  }) : false;

  // Compute dynamic time range to fit appointments past closing time
  const { startMin, endMin } = useMemo(() => {
    const openMin = barbearia?.hora_abertura ? toMin(barbearia.hora_abertura.substring(0, 5)) : 8 * 60;
    const closeMin = barbearia?.hora_fechamento ? toMin(barbearia.hora_fechamento.substring(0, 5)) : 20 * 60;
    let s = openMin;
    let e = closeMin;
    for (const a of agendamentos) {
      if (!a.hora) continue;
      const am = toMin(a.hora.substring(0, 5));
      if (am < s) s = Math.floor(am / 30) * 30;
      const aEnd = am + (a.duracao || 30);
      if (aEnd > e) e = Math.ceil(aEnd / 30) * 30;
    }
    return { startMin: s, endMin: e };
  }, [barbearia, agendamentos]);

  const timeSlots = generateSlots(startMin, endMin);

  const barbeirosAtivos = barbeiros.filter(b => b.ativo);
  const filteredBarbeiros = filtroBarbeiro === "todos"
    ? barbeirosAtivos
    : barbeirosAtivos.filter(b => b.id === filtroBarbeiro);

  const getAgendamentosInSlot = (barbeiroId: string, hora: string) => {
    const slotStart = toMin(hora);
    const slotEnd = slotStart + 30;
    return agendamentos.filter(a => {
      if (a.barbeiro_id !== barbeiroId || a.status === "cancelado" || !a.hora) return false;
      const agMin = toMin(a.hora.substring(0, 5));
      return agMin >= slotStart && agMin < slotEnd;
    });
  };

  const isBlocked = (barbeiroId: string, hora: string) => {
    return bloqueios.some((b: any) => {
      if (b.barbeiro_id !== barbeiroId) return false;
      if (b.dia_inteiro) return true;
      const start = b.hora_inicio?.substring(0, 5) || "00:00";
      const end = b.hora_fim?.substring(0, 5) || "23:59";
      return hora >= start && hora < end;
    });
  };

  const getBlockMotivo = (barbeiroId: string) => {
    const block = bloqueios.find((b: any) => b.barbeiro_id === barbeiroId);
    return block?.motivo || "Bloqueado";
  };

  const handleCriar = () => {
    if (!newSlot || horaBloqueada) return;
    const servico = servicos.find(s => s.id === newForm.servicoId);
    if (!newForm.clienteId || !servico) return;
    createAg.mutate({
      cliente_id: newForm.clienteId,
      barbeiro_id: newSlot.barbeiroId,
      servico_id: newForm.servicoId,
      data: dateStr,
      hora: newSlot.hora,
      duracao: servico.duracao,
      preco: servico.preco,
    }, {
      onSuccess: () => { setNewSlot(null); setNewForm({ clienteId: "", servicoId: "" }); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-1">Clique num horário vago para agendar ou num agendamento para gerenciar</p>
        </div>
        <Select value={filtroBarbeiro} onValueChange={setFiltroBarbeiro}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {barbeirosAtivos.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-center gap-4 bg-card border border-border rounded-xl p-3">
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <div className="text-center min-w-[200px]">
          <p className="font-display font-semibold text-foreground capitalize">{format(selectedDate, "EEEE", { locale: ptBR })}</p>
          <p className="text-sm text-muted-foreground">{format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}><ChevronRight className="w-4 h-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          <div className="grid border-b border-border" style={{ gridTemplateColumns: `80px repeat(${filteredBarbeiros.length}, 1fr)` }}>
            <div className="p-3 flex items-center justify-center border-r border-border"><Clock className="w-4 h-4 text-muted-foreground" /></div>
            {filteredBarbeiros.map(b => {
              const hasDayBlock = bloqueios.some((bl: any) => bl.barbeiro_id === b.id && bl.dia_inteiro);
              return (
                <div key={b.id} className={`p-3 text-center border-r border-border last:border-r-0 ${hasDayBlock ? "bg-destructive/10" : ""}`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold text-xs mx-auto mb-1">
                    {b.nome.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <p className="text-xs font-medium text-foreground truncate">{b.nome}</p>
                  {hasDayBlock && (
                    <p className="text-[9px] text-destructive mt-0.5 flex items-center justify-center gap-0.5">
                      <Ban className="w-2.5 h-2.5" /> {getBlockMotivo(b.id)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
            {timeSlots.map(hora => (
              <div
                key={hora}
                className="grid border-b border-border/50 hover:bg-muted/10 transition-colors"
                style={{ gridTemplateColumns: `80px repeat(${filteredBarbeiros.length}, 1fr)` }}
              >
                <div className="p-2 text-xs font-medium text-muted-foreground text-center border-r border-border flex items-center justify-center">{hora}</div>
                {filteredBarbeiros.map(b => {
                  const ags = getAgendamentosInSlot(b.id, hora);
                  const blocked = isBlocked(b.id, hora);
                  const slotStart = toMin(hora);
                  const empty = ags.length === 0 && !blocked;
                  return (
                    <div
                      key={b.id}
                      onClick={() => { if (empty) { setNewSlot({ barbeiroId: b.id, hora }); } }}
                      className={`p-1 border-r border-border/30 last:border-r-0 min-h-[40px] space-y-1 ${blocked && ags.length === 0 ? "bg-destructive/5" : ""} ${empty ? "cursor-pointer hover:bg-primary/5 group" : ""}`}
                    >
                      {ags.length > 0 ? (
                        ags.map(ag => {
                          const agMin = toMin(ag.hora!.substring(0, 5));
                          const offset = agMin - slotStart;
                          return (
                            <motion.div
                              key={ag.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedAg(ag); }}
                              className={`rounded-lg p-1.5 text-[10px] leading-tight border-l-2 cursor-pointer hover:brightness-110 ${statusColors[ag.status || "confirmado"]}`}
                            >
                              <p className="font-semibold text-foreground truncate flex items-center gap-1">
                                {offset > 0 && <span className="text-[9px] font-mono opacity-80">{ag.hora!.substring(0, 5)}</span>}
                                <span className="truncate">{(ag.clientes as any)?.nome || "Cliente"}</span>
                              </p>
                              <p className="text-muted-foreground truncate">{(ag.servicos as any)?.nome} • {ag.duracao}min</p>
                            </motion.div>
                          );
                        })
                      ) : blocked ? (
                        <div className="rounded-lg p-1.5 text-[10px] bg-destructive/10 border-l-2 border-destructive/30 flex items-center gap-1 text-destructive/70 h-full">
                          <Ban className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">Bloqueado</span>
                        </div>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-full text-primary">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-info/80" /> Confirmado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success/80" /> Concluído</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/40" /> Cancelado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" /> Bloqueado</span>
      </div>

      {/* Dialog: gerenciar agendamento */}
      <Dialog open={!!selectedAg} onOpenChange={(o) => !o && setSelectedAg(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Agendamento</DialogTitle></DialogHeader>
          {selectedAg && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Cliente:</span> <span className="font-semibold">{(selectedAg.clientes as any)?.nome}</span></p>
                <p><span className="text-muted-foreground">Barbeiro:</span> {(selectedAg.barbeiros as any)?.nome}</p>
                <p><span className="text-muted-foreground">Serviço:</span> {(selectedAg.servicos as any)?.nome}</p>
                <p><span className="text-muted-foreground">Horário:</span> {selectedAg.hora?.substring(0, 5)} • {selectedAg.duracao}min</p>
                <p><span className="text-muted-foreground">Valor:</span> R$ {selectedAg.preco}</p>
                <p><span className="text-muted-foreground">Status:</span> {selectedAg.status}</p>
              </div>
              {selectedAg.status === "confirmado" && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-success/20 text-success hover:bg-success/30 border border-success/30"
                    onClick={() => updateStatus.mutate({ id: selectedAg.id, status: "concluido" }, { onSuccess: () => setSelectedAg(null) })}
                  >
                    <Check className="w-4 h-4 mr-2" /> Concluir
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/30"
                    onClick={() => updateStatus.mutate({ id: selectedAg.id, status: "cancelado" }, { onSuccess: () => setSelectedAg(null) })}
                  >
                    <X className="w-4 h-4 mr-2" /> Cancelar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: novo agendamento */}
      <Dialog open={!!newSlot} onOpenChange={(o) => { if (!o) { setNewSlot(null); setNewForm({ clienteId: "", servicoId: "" }); } }}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display">
              Novo Agendamento {newSlot && `• ${newSlot.hora}`}
            </DialogTitle>
          </DialogHeader>
          {newSlot && (
            <div className="space-y-4 pt-2">
              <div className="text-sm text-muted-foreground">
                {barbeiros.find(b => b.id === newSlot.barbeiroId)?.nome} • {format(selectedDate, "dd/MM/yyyy")}
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={newForm.clienteId} onValueChange={v => setNewForm({ ...newForm, clienteId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select value={newForm.servicoId} onValueChange={v => setNewForm({ ...newForm, servicoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar serviço" /></SelectTrigger>
                  <SelectContent>{servicos.filter(s => s.ativo).map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - R${s.preco}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Hora</Label><Input type="time" value={newSlot.hora} onChange={e => setNewSlot({ ...newSlot, hora: e.target.value })} /></div>
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={dateStr} disabled /></div>
              </div>
              {horaBloqueada && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Barbeiro com agenda bloqueada neste horário.</span>
                </div>
              )}
              <Button onClick={handleCriar} disabled={createAg.isPending || horaBloqueada || !newForm.clienteId || !newForm.servicoId} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                {createAg.isPending ? "Criando..." : "Criar Agendamento"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
