import { useState } from "react";
import {
  useClientes,
  useCreateCliente,
  useUpdateCliente,
  useDeleteCliente,
  useAgendamentos,
  useBarbearia,
} from "@/hooks/useSupabaseData";
import { Plus, Phone, Calendar, Search, User, KeyRound, Pencil, Trash2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const hojeStr = () => new Date().toISOString().slice(0, 10);

export default function Clientes() {
  const { data: lista = [], isLoading } = useClientes();
  const { data: agendamentos = [] } = useAgendamentos();
  const { data: barbearia } = useBarbearia();
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "" });
  const [editando, setEditando] = useState<{ id: string; nome: string; telefone: string; email: string } | null>(null);
  const [excluindo, setExcluindo] = useState<{ id: string; nome: string } | null>(null);

  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const filtrados = lista.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone || "").includes(busca)
  );

  const handleCriar = () => {
    if (!form.nome.trim() || !form.telefone.trim()) return;
    createCliente.mutate({ nome: form.nome, telefone: form.telefone, email: form.email || undefined }, {
      onSuccess: () => { setDialogOpen(false); setForm({ nome: "", telefone: "", email: "" }); }
    });
  };

  const handleSalvarEdicao = () => {
    if (!editando || !editando.nome.trim() || !editando.telefone.trim()) return;
    updateCliente.mutate(
      { id: editando.id, nome: editando.nome, telefone: editando.telefone, email: editando.email || undefined },
      { onSuccess: () => setEditando(null) }
    );
  };

  const handleResetSenha = async (email: string | null) => {
    if (!email) return toast.error("Cliente não tem email cadastrado");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success(`Link de redefinição enviado para ${email}`);
  };

  const hoje = hojeStr();
  const agendamentoHoje = (clienteId: string) =>
    agendamentos.find(a => a.cliente_id === clienteId && a.data === hoje && a.status === "confirmado");

  const enviarWhats = (telefone: string | null, nome: string, hora: string) => {
    const num = (telefone || "").replace(/\D/g, "");
    if (!num) return toast.error("Cliente sem telefone cadastrado");
    const template = barbearia?.lembrete_mensagem || "Olá {nome}, não se esqueça do seu horário marcado hoje às {hora}!";
    const msg = template.replace(/{nome}/g, nome).replace(/{hora}/g, hora.substring(0, 5));
    const full = num.length <= 11 ? `55${num}` : num;
    window.open(`https://wa.me/${full}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{lista.length} clientes cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold"><Plus className="w-4 h-4 mr-2" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">Novo Cliente</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Nome completo" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(11) 99999-0000" /></div>
              <div className="space-y-2"><Label>Email (opcional)</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" /></div>
              <Button onClick={handleCriar} disabled={createCliente.isPending} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                {createCliente.isPending ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..." className="pl-10" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {filtrados.map((cli, i) => {
            const hist = agendamentos.filter(a => a.cliente_id === cli.id);
            const totalGasto = hist.filter(a => a.status !== "cancelado").reduce((s, a) => s + Number(a.preco), 0);
            const hojeAg = agendamentoHoje(cli.id);
            return (
              <motion.div key={cli.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{cli.nome}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {cli.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cli.telefone}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {hist.length} visitas</span>
                      {hojeAg && <span className="text-primary font-medium">Hoje às {hojeAg.hora.substring(0, 5)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-1">
                    <p className="text-sm font-semibold text-primary">R$ {totalGasto}</p>
                    <p className="text-[10px] text-muted-foreground">total gasto</p>
                  </div>
                  {hojeAg && (
                    <Button variant="ghost" size="sm" title="Enviar lembrete no WhatsApp"
                      onClick={() => enviarWhats(cli.telefone, cli.nome, hojeAg.hora)}>
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                    </Button>
                  )}
                  {cli.email && (
                    <Button variant="ghost" size="sm" onClick={() => handleResetSenha(cli.email)} title="Enviar reset de senha">
                      <KeyRound className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" title="Editar cliente"
                    onClick={() => setEditando({ id: cli.id, nome: cli.nome, telefone: cli.telefone || "", email: cli.email || "" })}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Excluir cliente"
                    onClick={() => setExcluindo({ id: cli.id, nome: cli.nome })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Editar Cliente</DialogTitle></DialogHeader>
          {editando && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={editando.nome} onChange={e => setEditando({ ...editando, nome: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={editando.telefone} onChange={e => setEditando({ ...editando, telefone: e.target.value })} /></div>
              <div className="space-y-2"><Label>Email (opcional)</Label><Input value={editando.email} onChange={e => setEditando({ ...editando, email: e.target.value })} /></div>
              <Button onClick={handleSalvarEdicao} disabled={updateCliente.isPending} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                {updateCliente.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {excluindo?.nome}? Clientes com agendamentos registrados não podem ser removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => excluindo && deleteCliente.mutate(excluindo.id, { onSuccess: () => setExcluindo(null) })}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
