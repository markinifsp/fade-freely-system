import { useState } from "react";
import { useAgendamentos, useBarbeiros, useServicos, useClientes, useCreateAgendamento, useUpdateAgendamentoStatus } from "@/hooks/useSupabaseData";
import { Calendar, Plus, Filter, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  confirmado: "bg-info/20 text-info border-info/30",
  concluido: "bg-success/20 text-success border-success/30",
  cancelado: "bg-destructive/20 text-destructive border-destructive/30",
};

const statusLabels: Record<string, string> = {
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default function Agendamentos() {
  const [filtroBarbeiro, setFiltroBarbeiro] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: "", barbeiroId: "", servicoId: "", data: new Date().toISOString().split("T")[0], hora: "09:00"
  });

  const { data: agendamentos = [], isLoading } = useAgendamentos();
  const { data: barbeiros = [] } = useBarbeiros();
  const { data: servicos = [] } = useServicos();
  const { data: clientes = [] } = useClientes();
  const createAg = useCreateAgendamento();
  const updateStatus = useUpdateAgendamentoStatus();

  const filtrados = agendamentos.filter(a => {
    if (filtroBarbeiro !== "todos" && a.barbeiro_id !== filtroBarbeiro) return false;
    if (filtroStatus !== "todos" && a.status !== filtroStatus) return false;
    return true;
  }).sort((a, b) => {
    const dateComp = (a.data || "").localeCompare(b.data || "");
    if (dateComp !== 0) return dateComp;
    return (a.hora || "").localeCompare(b.hora || "");
  });

  const handleCriar = () => {
    const servico = servicos.find(s => s.id === formData.servicoId);
    if (!formData.clienteId || !formData.barbeiroId || !servico) return;

    createAg.mutate({
      cliente_id: formData.clienteId,
      barbeiro_id: formData.barbeiroId,
      servico_id: formData.servicoId,
      data: formData.data,
      hora: formData.hora,
      duracao: servico.duracao,
      preco: servico.preco,
    }, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Agendamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie todos os agendamentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
              <Plus className="w-4 h-4 mr-2" /> Novo Agendamento
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">Novo Agendamento</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={formData.clienteId} onValueChange={v => setFormData({...formData, clienteId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Barbeiro</Label>
                <Select value={formData.barbeiroId} onValueChange={v => setFormData({...formData, barbeiroId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecionar barbeiro" /></SelectTrigger>
                  <SelectContent>{barbeiros.filter(b => b.ativo).map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select value={formData.servicoId} onValueChange={v => setFormData({...formData, servicoId: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecionar serviço" /></SelectTrigger>
                  <SelectContent>{servicos.filter(s => s.ativo).map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - R${s.preco}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} /></div>
                <div className="space-y-2"><Label>Hora</Label><Input type="time" value={formData.hora} onChange={e => setFormData({...formData, hora: e.target.value})} /></div>
              </div>
              <Button onClick={handleCriar} disabled={createAg.isPending} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                {createAg.isPending ? "Criando..." : "Criar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={filtroBarbeiro} onValueChange={setFiltroBarbeiro}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Barbeiros</SelectItem>
            {barbeiros.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
            <SelectItem value="concluido">Concluído</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          filtrados.map((ag, i) => (
            <motion.div
              key={ag.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-14 text-center flex-shrink-0">
                  <p className="text-lg font-bold text-primary">{ag.hora?.substring(0, 5)}</p>
                  <p className="text-[10px] text-muted-foreground">{ag.duracao}min</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{(ag.clientes as any)?.nome || "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{(ag.servicos as any)?.nome} • {(ag.barbeiros as any)?.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{ag.data}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColors[ag.status || "confirmado"]}`}>
                  {statusLabels[ag.status || "confirmado"]}
                </span>
                <p className="text-sm font-semibold text-foreground">R$ {ag.preco}</p>
                {ag.status === "confirmado" && (
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => updateStatus.mutate({ id: ag.id, status: "concluido" })} className="w-7 h-7 rounded-md bg-success/20 text-success hover:bg-success/30 flex items-center justify-center transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => updateStatus.mutate({ id: ag.id, status: "cancelado" })} className="w-7 h-7 rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 flex items-center justify-center transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
