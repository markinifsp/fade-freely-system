import { useState } from "react";
import { useClientes, useCreateCliente, useAgendamentos } from "@/hooks/useSupabaseData";
import { Plus, Phone, Calendar, Search, User, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Clientes() {
  const { data: lista = [], isLoading } = useClientes();
  const { data: agendamentos = [] } = useAgendamentos();
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "" });

  const createCliente = useCreateCliente();

  const filtrados = lista.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.telefone || "").includes(busca)
  );

  const handleCriar = () => {
    if (!form.nome.trim() || !form.telefone.trim()) return;
    createCliente.mutate({ nome: form.nome, telefone: form.telefone, email: form.email || undefined }, {
      onSuccess: () => { setDialogOpen(false); setForm({ nome: "", telefone: "", email: "" }); }
    });
  };

  const handleResetSenha = async (email: string | null) => {
    if (!email) return toast.error("Cliente não tem email cadastrado");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success(`Link de redefinição enviado para ${email}`);
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
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {cli.telefone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cli.telefone}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {hist.length} visitas</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">R$ {totalGasto}</p>
                    <p className="text-[10px] text-muted-foreground">total gasto</p>
                  </div>
                  {cli.email && (
                    <Button variant="ghost" size="sm" onClick={() => handleResetSenha(cli.email)} title="Enviar reset de senha">
                      <KeyRound className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
