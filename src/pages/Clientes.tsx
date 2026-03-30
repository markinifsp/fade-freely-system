import { useState } from "react";
import { clientes as mockClientes, agendamentos, Cliente } from "@/lib/mock-data";
import { Plus, Phone, Calendar, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

export default function Clientes() {
  const [lista, setLista] = useState<Cliente[]>(mockClientes);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "" });

  const filtrados = lista.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.telefone.includes(busca)
  );

  const handleCriar = () => {
    if (!form.nome.trim() || !form.telefone.trim()) return;
    const novo: Cliente = {
      id: String(Date.now()),
      nome: form.nome,
      telefone: form.telefone,
      email: form.email || undefined,
      criadoEm: new Date().toISOString().split("T")[0],
    };
    setLista([...lista, novo]);
    setDialogOpen(false);
    setForm({ nome: "", telefone: "", email: "" });
  };

  const getHistorico = (clienteId: string) =>
    agendamentos.filter(a => a.clienteId === clienteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{lista.length} clientes cadastrados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
              <Plus className="w-4 h-4 mr-2" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">Novo Cliente</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Nome completo" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(11) 99999-0000" /></div>
              <div className="space-y-2"><Label>Email (opcional)</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" /></div>
              <Button onClick={handleCriar} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou telefone..." className="pl-10" />
      </div>

      <div className="space-y-3">
        {filtrados.map((cli, i) => {
          const hist = getHistorico(cli.id);
          const totalGasto = hist.filter(a => a.status !== 'cancelado').reduce((s, a) => s + a.preco, 0);
          return (
            <motion.div
              key={cli.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{cli.nome}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cli.telefone}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {hist.length} visitas</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-primary">R$ {totalGasto}</p>
                <p className="text-[10px] text-muted-foreground">total gasto</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
