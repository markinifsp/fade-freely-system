import { useState } from "react";
import { configBarbearia, ConfigBarbearia } from "@/lib/mock-data";
import { Save, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";

const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function Configuracoes() {
  const [config, setConfig] = useState<ConfigBarbearia>(configBarbearia);

  const toggleDia = (dia: number) => {
    setConfig(prev => ({
      ...prev,
      diasFuncionamento: prev.diasFuncionamento.includes(dia)
        ? prev.diasFuncionamento.filter(d => d !== dia)
        : [...prev.diasFuncionamento, dia].sort()
    }));
  };

  const salvar = () => {
    toast.success("Configurações salvas com sucesso!");
  };

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
            <div className="space-y-2"><Label>Abertura</Label><Input type="time" value={config.horaAbertura} onChange={e => setConfig({...config, horaAbertura: e.target.value})} /></div>
            <div className="space-y-2"><Label>Fechamento</Label><Input type="time" value={config.horaFechamento} onChange={e => setConfig({...config, horaFechamento: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Intervalo Início</Label><Input type="time" value={config.intervaloInicio || ""} onChange={e => setConfig({...config, intervaloInicio: e.target.value})} /></div>
            <div className="space-y-2"><Label>Intervalo Fim</Label><Input type="time" value={config.intervaloFim || ""} onChange={e => setConfig({...config, intervaloFim: e.target.value})} /></div>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <h3 className="font-display font-semibold text-foreground">Dias de Funcionamento</h3>
          <div className="flex flex-wrap gap-2">
            {diasSemana.map((dia, idx) => (
              <button
                key={idx}
                onClick={() => toggleDia(idx)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  config.diasFuncionamento.includes(idx)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {dia}
              </button>
            ))}
          </div>
        </div>

        <Button onClick={salvar} className="w-full bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
          <Save className="w-4 h-4 mr-2" /> Salvar Configurações
        </Button>
      </motion.div>
    </div>
  );
}
