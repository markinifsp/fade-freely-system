import { useState } from "react";
import { useAgendamentos, useBarbeiros } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, ChevronRight, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function generateTimeSlots(start: string, end: string): string[] {
  const slots: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let h = sh, m = sm;
  while (h < eh || (h === eh && m <= em)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { h++; m = 0; }
  }
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
  const { role, barbeariaId } = useAuth();
  const { data: bloqueios = [] } = useBloqueiosByDate(dateStr, barbeariaId);

  const timeSlots = generateTimeSlots("08:00", "20:00");

  const barbeirosAtivos = barbeiros.filter(b => b.ativo);
  const filteredBarbeiros = filtroBarbeiro === "todos"
    ? barbeirosAtivos
    : barbeirosAtivos.filter(b => b.id === filtroBarbeiro);

  const getAgendamento = (barbeiroId: string, hora: string) => {
    return agendamentos.find(a =>
      a.barbeiro_id === barbeiroId && a.hora?.substring(0, 5) === hora && a.status !== "cancelado"
    );
  };

  const isBlocked = (barbeiroId: string, hora: string) => {
    return bloqueios.some((b: any) => {
      if (b.barbeiro_id !== barbeiroId) return false;
      if (b.dia_inteiro) return true;
      const slotTime = hora;
      const start = b.hora_inicio?.substring(0, 5) || "00:00";
      const end = b.hora_fim?.substring(0, 5) || "23:59";
      return slotTime >= start && slotTime < end;
    });
  };

  const getBlockMotivo = (barbeiroId: string) => {
    const block = bloqueios.find((b: any) => b.barbeiro_id === barbeiroId);
    return block?.motivo || "Bloqueado";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualização diária da agenda</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroBarbeiro} onValueChange={setFiltroBarbeiro}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {barbeirosAtivos.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date navigation */}
      <div className="flex items-center justify-center gap-4 bg-card border border-border rounded-xl p-3">
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center min-w-[200px]">
          <p className="font-display font-semibold text-foreground capitalize">
            {format(selectedDate, "EEEE", { locale: ptBR })}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
          Hoje
        </Button>
      </div>

      {/* Calendar grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
          {/* Header with barber names */}
          <div className="grid border-b border-border" style={{ gridTemplateColumns: `80px repeat(${filteredBarbeiros.length}, 1fr)` }}>
            <div className="p-3 flex items-center justify-center border-r border-border">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
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

          {/* Time slots */}
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
            {timeSlots.map(hora => (
              <div
                key={hora}
                className="grid border-b border-border/50 hover:bg-muted/10 transition-colors"
                style={{ gridTemplateColumns: `80px repeat(${filteredBarbeiros.length}, 1fr)` }}
              >
                <div className="p-2 text-xs font-medium text-muted-foreground text-center border-r border-border flex items-center justify-center">
                  {hora}
                </div>
                {filteredBarbeiros.map(b => {
                  const ag = getAgendamento(b.id, hora);
                  const blocked = isBlocked(b.id, hora);
                  return (
                    <div key={b.id} className={`p-1 border-r border-border/30 last:border-r-0 min-h-[40px] ${blocked && !ag ? "bg-destructive/5" : ""}`}>
                      {ag ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`rounded-lg p-1.5 text-[10px] leading-tight border-l-2 ${statusColors[ag.status || "confirmado"]}`}
                        >
                          <p className="font-semibold text-foreground truncate">
                            {(ag.clientes as any)?.nome || "Cliente"}
                          </p>
                          <p className="text-muted-foreground truncate">
                            {(ag.servicos as any)?.nome} • {ag.duracao}min
                          </p>
                        </motion.div>
                      ) : blocked ? (
                        <div className="rounded-lg p-1.5 text-[10px] bg-destructive/10 border-l-2 border-destructive/30 flex items-center gap-1 text-destructive/70 h-full">
                          <Ban className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">Bloqueado</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-info/80" /> Confirmado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-success/80" /> Concluído</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/40" /> Cancelado</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-destructive/10 border border-destructive/30" /> Bloqueado</span>
      </div>
    </div>
  );
}
