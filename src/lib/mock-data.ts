// Mock data for the barbershop management system

export interface Barbeiro {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  comissao: number; // percentage
  ativo: boolean;
  avatar?: string;
  diasFolga: number[]; // 0=Sunday, 6=Saturday
  horaInicio: string;
  horaFim: string;
}

export interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number; // minutes
  ativo: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  criadoEm: string;
}

export type StatusAgendamento = 'confirmado' | 'cancelado' | 'concluido';

export interface Agendamento {
  id: string;
  clienteId: string;
  clienteNome: string;
  barbeiroId: string;
  barbeiroNome: string;
  servicoId: string;
  servicoNome: string;
  data: string; // YYYY-MM-DD
  hora: string; // HH:mm
  duracao: number;
  preco: number;
  status: StatusAgendamento;
  criadoEm: string;
}

export interface ConfigBarbearia {
  nome: string;
  endereco: string;
  telefone: string;
  horaAbertura: string;
  horaFechamento: string;
  intervaloInicio?: string;
  intervaloFim?: string;
  diasFuncionamento: number[];
}

export const barbeiros: Barbeiro[] = [
  { id: '1', nome: 'Carlos Silva', telefone: '(11) 99999-1111', email: 'carlos@barber.com', comissao: 40, ativo: true, diasFolga: [0], horaInicio: '09:00', horaFim: '18:00' },
  { id: '2', nome: 'Rafael Santos', telefone: '(11) 99999-2222', email: 'rafael@barber.com', comissao: 35, ativo: true, diasFolga: [0, 1], horaInicio: '10:00', horaFim: '19:00' },
  { id: '3', nome: 'Lucas Oliveira', telefone: '(11) 99999-3333', email: 'lucas@barber.com', comissao: 40, ativo: true, diasFolga: [0], horaInicio: '09:00', horaFim: '18:00' },
];

export const servicos: Servico[] = [
  { id: '1', nome: 'Corte Masculino', preco: 45, duracao: 30, ativo: true },
  { id: '2', nome: 'Barba', preco: 30, duracao: 20, ativo: true },
  { id: '3', nome: 'Corte + Barba', preco: 65, duracao: 45, ativo: true },
  { id: '4', nome: 'Sobrancelha', preco: 15, duracao: 10, ativo: true },
  { id: '5', nome: 'Pigmentação', preco: 80, duracao: 60, ativo: true },
  { id: '6', nome: 'Hidratação', preco: 40, duracao: 30, ativo: true },
];

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const clientes: Cliente[] = [
  { id: '1', nome: 'João Mendes', telefone: '(11) 98888-1111', criadoEm: '2024-01-15' },
  { id: '2', nome: 'Pedro Alves', telefone: '(11) 98888-2222', criadoEm: '2024-02-10' },
  { id: '3', nome: 'Marcos Lima', telefone: '(11) 98888-3333', criadoEm: '2024-03-05' },
  { id: '4', nome: 'André Costa', telefone: '(11) 98888-4444', criadoEm: '2024-03-20' },
  { id: '5', nome: 'Bruno Souza', telefone: '(11) 98888-5555', criadoEm: '2024-04-01' },
  { id: '6', nome: 'Felipe Rocha', telefone: '(11) 98888-6666', criadoEm: '2024-04-15' },
];

export const agendamentos: Agendamento[] = [
  { id: '1', clienteId: '1', clienteNome: 'João Mendes', barbeiroId: '1', barbeiroNome: 'Carlos Silva', servicoId: '1', servicoNome: 'Corte Masculino', data: formatDate(today), hora: '09:00', duracao: 30, preco: 45, status: 'confirmado', criadoEm: formatDate(today) },
  { id: '2', clienteId: '2', clienteNome: 'Pedro Alves', barbeiroId: '1', barbeiroNome: 'Carlos Silva', servicoId: '3', servicoNome: 'Corte + Barba', data: formatDate(today), hora: '10:00', duracao: 45, preco: 65, status: 'confirmado', criadoEm: formatDate(today) },
  { id: '3', clienteId: '3', clienteNome: 'Marcos Lima', barbeiroId: '2', barbeiroNome: 'Rafael Santos', servicoId: '1', servicoNome: 'Corte Masculino', data: formatDate(today), hora: '10:30', duracao: 30, preco: 45, status: 'concluido', criadoEm: formatDate(today) },
  { id: '4', clienteId: '4', clienteNome: 'André Costa', barbeiroId: '3', barbeiroNome: 'Lucas Oliveira', servicoId: '2', servicoNome: 'Barba', data: formatDate(today), hora: '11:00', duracao: 20, preco: 30, status: 'confirmado', criadoEm: formatDate(today) },
  { id: '5', clienteId: '5', clienteNome: 'Bruno Souza', barbeiroId: '2', barbeiroNome: 'Rafael Santos', servicoId: '5', servicoNome: 'Pigmentação', data: formatDate(today), hora: '14:00', duracao: 60, preco: 80, status: 'confirmado', criadoEm: formatDate(today) },
  { id: '6', clienteId: '6', clienteNome: 'Felipe Rocha', barbeiroId: '1', barbeiroNome: 'Carlos Silva', servicoId: '3', servicoNome: 'Corte + Barba', data: formatDate(today), hora: '15:00', duracao: 45, preco: 65, status: 'cancelado', criadoEm: formatDate(today) },
  { id: '7', clienteId: '1', clienteNome: 'João Mendes', barbeiroId: '3', barbeiroNome: 'Lucas Oliveira', servicoId: '6', servicoNome: 'Hidratação', data: formatDate(today), hora: '16:00', duracao: 30, preco: 40, status: 'confirmado', criadoEm: formatDate(today) },
];

export const configBarbearia: ConfigBarbearia = {
  nome: 'BarberShop Premium',
  endereco: 'Rua das Flores, 123 - Centro',
  telefone: '(11) 3333-4444',
  horaAbertura: '09:00',
  horaFechamento: '20:00',
  intervaloInicio: '12:00',
  intervaloFim: '13:00',
  diasFuncionamento: [1, 2, 3, 4, 5, 6],
};
