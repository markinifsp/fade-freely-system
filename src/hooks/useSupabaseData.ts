import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useBarbeiros() {
  const { barbeariaId } = useAuth();
  return useQuery({
    queryKey: ["barbeiros", barbeariaId],
    queryFn: async () => {
      if (!barbeariaId) return [];
      const { data, error } = await supabase
        .from("barbeiros")
        .select("*, barbeiro_permissoes(*)")
        .eq("barbearia_id", barbeariaId)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!barbeariaId,
  });
}

export function useServicos() {
  const { barbeariaId } = useAuth();
  return useQuery({
    queryKey: ["servicos", barbeariaId],
    queryFn: async () => {
      if (!barbeariaId) return [];
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("barbearia_id", barbeariaId)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!barbeariaId,
  });
}

export function useClientes() {
  const { barbeariaId } = useAuth();
  return useQuery({
    queryKey: ["clientes", barbeariaId],
    queryFn: async () => {
      if (!barbeariaId) return [];
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .eq("barbearia_id", barbeariaId)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!barbeariaId,
  });
}

export function useAgendamentos(date?: string) {
  const { barbeariaId } = useAuth();
  return useQuery({
    queryKey: ["agendamentos", barbeariaId, date],
    queryFn: async () => {
      if (!barbeariaId) return [];
      let query = supabase
        .from("agendamentos")
        .select("*, barbeiros(nome), clientes(nome), servicos(nome)")
        .eq("barbearia_id", barbeariaId)
        .order("hora");
      if (date) query = query.eq("data", date);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!barbeariaId,
  });
}

export function useBarbearia() {
  const { barbeariaId } = useAuth();
  return useQuery({
    queryKey: ["barbearia", barbeariaId],
    queryFn: async () => {
      if (!barbeariaId) return null;
      const { data, error } = await supabase
        .from("barbearias")
        .select("*")
        .eq("id", barbeariaId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!barbeariaId,
  });
}

export function useBloqueios(barbeiroId?: string) {
  return useQuery({
    queryKey: ["bloqueios", barbeiroId],
    queryFn: async () => {
      if (!barbeiroId) return [];
      const { data, error } = await supabase
        .from("barbeiro_bloqueios")
        .select("*")
        .eq("barbeiro_id", barbeiroId)
        .order("data");
      if (error) throw error;
      return data;
    },
    enabled: !!barbeiroId,
  });
}

// Mutations
export function useCreateBarbeiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; telefone: string; email: string; password: string; comissao: number; horaInicio: string; horaFim: string }) => {
      const { data: result, error } = await supabase.functions.invoke("create-barbeiro", {
        body: {
          action: "create",
          nome: data.nome,
          email: data.email,
          password: data.password,
          telefone: data.telefone,
          comissao: data.comissao,
          horaInicio: data.horaInicio,
          horaFim: data.horaFim,
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["barbeiros"] });
      toast.success("Barbeiro cadastrado com acesso!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateBarbeiroCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { barbeiroId: string; email?: string; password?: string }) => {
      const { data: result, error } = await supabase.functions.invoke("create-barbeiro", {
        body: {
          action: "update_credentials",
          barbeiroId: data.barbeiroId,
          email: data.email,
          password: data.password,
        },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["barbeiros"] });
      toast.success("Credenciais atualizadas!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useCreateServico() {
  const qc = useQueryClient();
  const { barbeariaId } = useAuth();
  return useMutation({
    mutationFn: async (data: { nome: string; preco: number; duracao: number }) => {
      if (!barbeariaId) throw new Error("Sem barbearia");
      const { error } = await supabase.from("servicos").insert({ ...data, barbearia_id: barbeariaId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço cadastrado!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  const { barbeariaId } = useAuth();
  return useMutation({
    mutationFn: async (data: { nome: string; telefone: string; email?: string }) => {
      if (!barbeariaId) throw new Error("Sem barbearia");
      const { error } = await supabase.from("clientes").insert({ ...data, barbearia_id: barbeariaId });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente cadastrado!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useCreateAgendamento() {
  const qc = useQueryClient();
  const { barbeariaId } = useAuth();
  return useMutation({
    mutationFn: async (data: {
      cliente_id: string;
      barbeiro_id: string;
      servico_id: string;
      data: string;
      hora: string;
      duracao: number;
      preco: number;
    }) => {
      if (!barbeariaId) throw new Error("Sem barbearia");
      const { error } = await supabase.from("agendamentos").insert({
        ...data,
        barbearia_id: barbeariaId,
      });
      if (error) {
        if (error.message.includes("idx_no_double_booking")) {
          throw new Error("Horário já ocupado para este barbeiro!");
        }
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
      toast.success("Agendamento criado!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateAgendamentoStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agendamentos"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateBarbeiroPermissoes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ barbeiroId, permissoes }: {
      barbeiroId: string;
      permissoes: { ver_agenda_outros?: boolean; ver_faturamento_total?: boolean; editar_propria_agenda?: boolean };
    }) => {
      const { error } = await supabase
        .from("barbeiro_permissoes")
        .upsert({ barbeiro_id: barbeiroId, ...permissoes }, { onConflict: "barbeiro_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["barbeiros"] });
      toast.success("Permissões atualizadas!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateBarbeiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; ativo?: boolean; hora_inicio?: string; hora_fim?: string; dias_folga?: number[]; comissao?: number }) => {
      const { error } = await supabase.from("barbeiros").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["barbeiros"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteBarbeiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbeiros").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["barbeiros"] });
      toast.success("Barbeiro removido!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; ativo?: boolean; nome?: string; preco?: number; duracao?: number }) => {
      const { error } = await supabase.from("servicos").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("servicos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço removido!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateBarbearia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nome?: string; endereco?: string; telefone?: string; hora_abertura?: string; hora_fechamento?: string; intervalo_inicio?: string; intervalo_fim?: string; dias_funcionamento?: number[] }) => {
      const { error } = await supabase.from("barbearias").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["barbearia"] });
      toast.success("Configurações salvas!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useCreateBloqueio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { barbeiro_id: string; data: string; dia_inteiro?: boolean; hora_inicio?: string; hora_fim?: string; motivo?: string }) => {
      const { error } = await supabase.from("barbeiro_bloqueios").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bloqueios"] });
      toast.success("Bloqueio adicionado!");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteBloqueio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbeiro_bloqueios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bloqueios"] });
      toast.success("Bloqueio removido!");
    },
    onError: (e) => toast.error(e.message),
  });
}
