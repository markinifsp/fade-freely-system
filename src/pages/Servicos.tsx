import { useState } from "react";
import { useServicos, useCreateServico, useUpdateServico, useDeleteServico } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Clock, DollarSign, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

export default function Servicos() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { data: lista = [], isLoading } = useServicos();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", preco: "", duracao: "30" });

  const createServico = useCreateServico();
  const updateServico = useUpdateServico();
  const deleteServico = useDeleteServico();

  const handleCriar = () => {
    if (!form.nome.trim() || !form.preco) return;
    createServico.mutate({ nome: form.nome, preco: Number(form.preco), duracao: Number(form.duracao) }, {
      onSuccess: () => { setDialogOpen(false); setForm({ nome: "", preco: "", duracao: "30" }); }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Serviços</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre e gerencie seus serviços</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
                <Plus className="w-4 h-4 mr-2" /> Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="font-display">Novo Serviço</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Ex: Corte Masculino" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Preço (R$)</Label><Input type="number" value={form.preco} onChange={e => setForm({...form, preco: e.target.value})} placeholder="45" /></div>
                  <div className="space-y-2"><Label>Duração (min)</Label><Input type="number" value={form.duracao} onChange={e => setForm({...form, duracao: e.target.value})} placeholder="30" /></div>
                </div>
                <Button onClick={handleCriar} disabled={createServico.isPending} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                  {createServico.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map((serv, i) => (
            <motion.div key={serv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-card border rounded-xl p-5 space-y-3 transition-all ${serv.ativo ? "border-border hover:border-primary/20" : "border-border/50 opacity-60"}`}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{serv.nome}</h3>
                {isAdmin && <Switch checked={serv.ativo ?? true} onCheckedChange={() => updateServico.mutate({ id: serv.id, ativo: !serv.ativo })} />}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-primary">
                  <DollarSign className="w-4 h-4" /><span className="text-lg font-bold">R$ {serv.preco}</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <Clock className="w-3.5 h-3.5" /><span>{serv.duracao} min</span>
                </div>
              </div>
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => deleteServico.mutate(serv.id)} className="text-xs border-border text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3 h-3 mr-1" /> Remover
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
