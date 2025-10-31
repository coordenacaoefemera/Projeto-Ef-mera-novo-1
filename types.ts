// Fix: Replaced incorrect component definitions with actual type definitions.
export const groupOptions = [
  'Acolhimento Emergencial',
  'Florescer Feminino',
  'Círculo de Cura',
  'Terapia Individual',
  'Terapia com valores sociais',
  'Outro',
] as const;

export type Group = (typeof groupOptions)[number];

export type AttendanceStatus = 'present' | 'absent';

export interface AttendanceRecord {
  status: AttendanceStatus;
  evolution?: string;
  time?: string;
}

export interface Evaluation {
  id: string;
  date: string; // YYYY-MM-DD
  notes: string;
}

export interface Acolhida {
  id: string;
  name: string;
  email?: string;
  cpf: string;
  phone: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  observations: string;
  groups: Group[]; // Alterado de 'group' para 'groups' (array)
  status: 'ativa' | 'inativa';
  therapistName?: string;
  therapistPhone?: string;
  therapistEmail?: string;
  departureReason?: string;
  attendance: Record<string, Partial<AttendanceRecord>>;
  evaluations: Evaluation[];
  isOnWaitingList?: boolean;
  isOnWaitingListSocial?: boolean;
}