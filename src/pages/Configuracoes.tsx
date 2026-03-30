import { useState, useEffect } from "react";
import { useBarbearia, useUpdateBarbearia } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";

const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function Configuracoes() {
  const { role } = useAuth();
  const { data: barbearia, isLoading } = useBarbearia();
  const updateBarbearia = useUpdateBarbearia();

  const [config, setConfig] = useState({
    nome: "", endereco: "", telefone: "",
    hora_abertura: "09:00", hora_fechamento: "20:00",
    intervalo_inicio: "", intervalo_fim: "",
    dias_funcionamento: [1, 2, 3, 4, 5, 6],
  });

  useEffect(() => {
    if (barbearia) {
      setConfig({
        nome: barbearia.nome || "",
        endereco: barbearia.endereco || "",
        telefone: barbearia.telefone || "",
        hora_abertura: barbearia.hora_abertura?.substring(0, 5) || "09:00",
        hora_fechamento: barbearia.hora_fechamento?.substring(0, 5) || "20:00",
        intervalo_inicio: barbearia.intervalo_inicio?.substring(0, 5) || "",
        intervalo_fim: barbearia.intervalo_fim?.substring(0, 5) || "",
        dias_funcionamento: barbearia.dias_funcionamento || [1, 2, 3, 4, 5, 6],
      });
    }
  }, [barbearia]);

  const toggleDia = (dia: number) => {
    setConfig(prev => ({
      ...prev,
      dias_funcionamento: prev.dias_funcionamento.includes(dia)
        ? prev.dias_funcionamento.filter(d => d !== dia)
        : [...prev.dias_funcionamento, dia].sort()
    }));
  };

  const salvar = () => {
    if (!barbearia) return;
    updateBarbearia.mutate({ id: barbearia.id, ...config });
  };

  if (isLoading) return <div className="text-center py-12 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure sua barbearia</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-card">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-foreground">Dados da Barbearia</h2>
            <p className="text-xs text-muted-foreground">Informações gerais</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2"><Label>Nome</Label><Input value={config.nome} onChange={e => setConfig({...config, nome: e.target.value})} /></div>
          <div className="space-y-2"><Label>Endereço</Label><Input value={config.endereco} onChange={e => setConfig({...config, endereco: e.target.value})} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={config.telefone} onChange={e => setConfig({...config, telefone: e.target.value})} /></div>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <h3 className="font-display font-semibold text-foreground">Horário de Funcionamento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Abertura</Label><Input type="time" value={config.hora_abertura} onChange={e => setConfig({...config, hora_abertura: e.target.value})} /></div>
            <div className="space-y-2"><Label>Fechamento</Label><Input type="time" value={config.hora_fechamento} onChange={e => setConfig({...config, hora_fechamento: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Intervalo Início</Label><Input type="time" value={config.intervalo_inicio} onChange={e => setConfig({...config, intervalo_inicio: e.target.value})} /></div>
            <div className="space-y-2"><Label>Intervalo Fim</Label><Input type="time" value={config.intervalo_fim} onChange={e => setConfig({...config, intervalo_fim: e.target.value})} /></div>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground">Dias de Funcionamento</h3>
          <div className="flex flex-wrap gap-2">
            {diasSemana.map((dia, idx) => (
              <button key={idx} onClick={() => toggleDia(idx)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  config.dias_funcionamento.includes(idx) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >{dia}</button>
            ))}
          </div>
        </div>

        <Button onClick={salvar} disabled={updateBarbearia.isPending} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
          <Save className="w-4 h-4 mr-2" /> {updateBarbearia.isPending ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </motion.div>
    </div>
  );
}
