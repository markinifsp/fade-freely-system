import { useState } from "react";
import { barbeiros as mockBarbeiros, Barbeiro } from "@/lib/mock-data";
import { Plus, Scissors, Phone, Mail, Percent, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Barbeiros() {
  const [lista, setLista] = useState<Barbeiro[]>(mockBarbeiros);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", comissao: "40", horaInicio: "09:00", horaFim: "18:00" });

  const handleCriar = () => {
    if (!form.nome.trim()) return;
    const novo: Barbeiro = {
      id: String(Date.now()),
      nome: form.nome,
      telefone: form.telefone,
      email: form.email,
      comissao: Number(form.comissao),
      ativo: true,
      diasFolga: [0],
      horaInicio: form.horaInicio,
      horaFim: form.horaFim,
    };
    setLista([...lista, novo]);
    setDialogOpen(false);
    setForm({ nome: "", telefone: "", email: "", comissao: "40", horaInicio: "09:00", horaFim: "18:00" });
  };

  const toggleAtivo = (id: string) => {
    setLista(lista.map(b => b.id === id ? { ...b, ativo: !b.ativo } : b));
  };

  const remover = (id: string) => {
    setLista(lista.filter(b => b.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Barbeiros</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua equipe</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
              <Plus className="w-4 h-4 mr-2" /> Novo Barbeiro
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-display">Novo Barbeiro</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Nome</Label><Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Nome completo" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} placeholder="(11) 99999-0000" /></div>
                <div className="space-y-2"><Label>Comissão (%)</Label><Input type="number" value={form.comissao} onChange={e => setForm({...form, comissao: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Hora Início</Label><Input type="time" value={form.horaInicio} onChange={e => setForm({...form, horaInicio: e.target.value})} /></div>
                <div className="space-y-2"><Label>Hora Fim</Label><Input type="time" value={form.horaFim} onChange={e => setForm({...form, horaFim: e.target.value})} /></div>
              </div>
              <Button onClick={handleCriar} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">Cadastrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lista.map((barb, i) => (
          <motion.div
            key={barb.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`bg-card border rounded-xl p-5 space-y-4 transition-all ${barb.ativo ? "border-border hover:border-primary/20" : "border-border/50 opacity-60"}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">
                  {barb.nome.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{barb.nome}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Percent className="w-3 h-3" /> {barb.comissao}% comissão
                  </div>
                </div>
              </div>
              <Switch checked={barb.ativo} onCheckedChange={() => toggleAtivo(barb.id)} />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {barb.telefone}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {barb.email}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Scissors className="w-3.5 h-3.5" /> {barb.horaInicio} - {barb.horaFim}</div>
            </div>
            <div className="flex gap-1">
              {diasSemana.map((dia, idx) => (
                <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded ${barb.diasFolga.includes(idx) ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}>
                  {dia}
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1 text-xs border-border"><Edit2 className="w-3 h-3 mr-1" /> Editar</Button>
              <Button variant="outline" size="sm" onClick={() => remover(barb.id)} className="text-xs border-border text-destructive hover:bg-destructive/10"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
