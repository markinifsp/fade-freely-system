import { useState } from "react";
import { useBarbeiros, useCreateBarbeiro, useUpdateBarbeiro, useDeleteBarbeiro, useUpdateBarbeiroPermissoes, useUpdateBarbeiroCredentials, useBloqueios, useCreateBloqueio, useDeleteBloqueio } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Scissors, Phone, Mail, Percent, Edit2, Trash2, Shield, Key, CalendarOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Barbeiros() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const { data: lista = [], isLoading } = useBarbeiros();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [permDialogBarbeiro, setPermDialogBarbeiro] = useState<any>(null);
  const [credDialogBarbeiro, setCredDialogBarbeiro] = useState<any>(null);
  const [bloqueioDialogBarbeiro, setBloqueioDialogBarbeiro] = useState<any>(null);
  const [form, setForm] = useState({ nome: "", telefone: "", email: "", password: "", comissao: "40", horaInicio: "09:00", horaFim: "18:00" });

  const createBarbeiro = useCreateBarbeiro();
  const updateBarbeiro = useUpdateBarbeiro();
  const deleteBarbeiro = useDeleteBarbeiro();
  const updatePermissoes = useUpdateBarbeiroPermissoes();
  const updateCredentials = useUpdateBarbeiroCredentials();

  const handleCriar = () => {
    if (!form.nome.trim() || !form.email.trim() || !form.password.trim()) return;
    createBarbeiro.mutate({
      nome: form.nome, telefone: form.telefone, email: form.email, password: form.password,
      comissao: Number(form.comissao), horaInicio: form.horaInicio, horaFim: form.horaFim,
    }, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ nome: "", telefone: "", email: "", password: "", comissao: "40", horaInicio: "09:00", horaFim: "18:00" });
      },
    });
  };

  const toggleAtivo = (barb: any) => {
    updateBarbeiro.mutate({ id: barb.id, ativo: !barb.ativo });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Barbeiros</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie sua equipe</p>
        </div>
        {isAdmin && (
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
                <div className="space-y-2"><Label>Email (login)</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@exemplo.com" /></div>
                <div className="space-y-2"><Label>Senha</Label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mínimo 6 caracteres" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Hora Início</Label><Input type="time" value={form.horaInicio} onChange={e => setForm({...form, horaInicio: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Hora Fim</Label><Input type="time" value={form.horaFim} onChange={e => setForm({...form, horaFim: e.target.value})} /></div>
                </div>
                <Button onClick={handleCriar} disabled={createBarbeiro.isPending} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90">
                  {createBarbeiro.isPending ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {lista.map((barb, i) => {
            const perms = barb.barbeiro_permissoes?.[0] || barb.barbeiro_permissoes;
            return (
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
                  {isAdmin && <Switch checked={barb.ativo ?? true} onCheckedChange={() => toggleAtivo(barb)} />}
                </div>
                <div className="space-y-2 text-sm">
                  {barb.telefone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" /> {barb.telefone}</div>}
                  {barb.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-3.5 h-3.5" /> {barb.email}</div>}
                  <div className="flex items-center gap-2 text-muted-foreground"><Scissors className="w-3.5 h-3.5" /> {barb.hora_inicio?.substring(0, 5)} - {barb.hora_fim?.substring(0, 5)}</div>
                </div>
                <div className="flex gap-1">
                  {diasSemana.map((dia, idx) => (
                    <span key={idx} className={`text-[10px] px-1.5 py-0.5 rounded ${barb.dias_folga?.includes(idx) ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success"}`}>
                      {dia}
                    </span>
                  ))}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 pt-1 flex-wrap">
                    <Button variant="outline" size="sm" onClick={() => setPermDialogBarbeiro(barb)} className="flex-1 text-xs border-border">
                      <Shield className="w-3 h-3 mr-1" /> Permissões
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCredDialogBarbeiro(barb)} className="flex-1 text-xs border-border">
                      <Key className="w-3 h-3 mr-1" /> Credenciais
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteBarbeiro.mutate(barb.id)} className="text-xs border-border text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Permissions Dialog */}
      <Dialog open={!!permDialogBarbeiro} onOpenChange={() => setPermDialogBarbeiro(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Permissões — {permDialogBarbeiro?.nome}</DialogTitle></DialogHeader>
          {permDialogBarbeiro && (
            <PermissoesForm
              barbeiro={permDialogBarbeiro}
              onSave={(perms) => {
                updatePermissoes.mutate({ barbeiroId: permDialogBarbeiro.id, permissoes: perms });
                setPermDialogBarbeiro(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={!!credDialogBarbeiro} onOpenChange={() => setCredDialogBarbeiro(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-display">Credenciais — {credDialogBarbeiro?.nome}</DialogTitle></DialogHeader>
          {credDialogBarbeiro && (
            <CredenciaisForm
              barbeiro={credDialogBarbeiro}
              onSave={(creds) => {
                updateCredentials.mutate({ barbeiroId: credDialogBarbeiro.id, ...creds });
                setCredDialogBarbeiro(null);
              }}
              isPending={updateCredentials.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PermissoesForm({ barbeiro, onSave }: { barbeiro: any; onSave: (p: any) => void }) {
  const perms = Array.isArray(barbeiro.barbeiro_permissoes) ? barbeiro.barbeiro_permissoes[0] : barbeiro.barbeiro_permissoes;
  const [verAgenda, setVerAgenda] = useState(perms?.ver_agenda_outros ?? false);
  const [verFat, setVerFat] = useState(perms?.ver_faturamento_total ?? false);
  const [editAgenda, setEditAgenda] = useState(perms?.editar_propria_agenda ?? true);

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">Ver agenda de outros</p>
          <p className="text-xs text-muted-foreground">Pode visualizar agendamentos de outros barbeiros</p>
        </div>
        <Switch checked={verAgenda} onCheckedChange={setVerAgenda} />
      </div>
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">Ver faturamento total</p>
          <p className="text-xs text-muted-foreground">Pode ver receita de toda a barbearia</p>
        </div>
        <Switch checked={verFat} onCheckedChange={setVerFat} />
      </div>
      <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-foreground">Editar própria agenda</p>
          <p className="text-xs text-muted-foreground">Pode bloquear dias e alterar horários</p>
        </div>
        <Switch checked={editAgenda} onCheckedChange={setEditAgenda} />
      </div>
      <Button
        onClick={() => onSave({ ver_agenda_outros: verAgenda, ver_faturamento_total: verFat, editar_propria_agenda: editAgenda })}
        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
      >
        Salvar Permissões
      </Button>
    </div>
  );
}

function CredenciaisForm({ barbeiro, onSave, isPending }: { barbeiro: any; onSave: (c: { email?: string; password?: string }) => void; isPending: boolean }) {
  const [email, setEmail] = useState(barbeiro.email || "");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Email de acesso</Label>
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
      </div>
      <div className="space-y-2">
        <Label>Nova senha</Label>
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Deixe vazio para manter" />
      </div>
      <p className="text-xs text-muted-foreground">O barbeiro usará estes dados para fazer login no sistema.</p>
      <Button
        onClick={() => onSave({
          email: email !== barbeiro.email ? email : undefined,
          password: password || undefined,
        })}
        disabled={isPending || (!password && email === (barbeiro.email || ""))}
        className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90"
      >
        {isPending ? "Salvando..." : "Atualizar Credenciais"}
      </Button>
    </div>
  );
}
