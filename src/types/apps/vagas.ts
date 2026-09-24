export type VagaStatus = "ATUANDO" | "PAUSADA" | "FECHADA" | "CANCELADA";

/**
 * Identificador interno do tipo da etapa. A regra de fechamento depende
 * deste valor, nunca do nome exibido (que pode ser renomeado pelo recruiter).
 */
export type EtapaTipo = "PADRAO" | "FECHAMENTO";

/** Etapa da vaga: fonte única de verdade para o funil e o Kanban. */
export interface EtapaType {
  id: string;
  name: string;
  /** Posição explícita da etapa, começando em 1 */
  order: number;
  type: EtapaTipo;
  candidatesCount: number;
}

export interface VagaType {
  id: string;
  /** Código informado pelo recruiter: obrigatório, único e de formato livre */
  code: string;
  recruiterId: string;
  title: string;
  description: string;
  status: VagaStatus;
  etapas: EtapaType[];
  /** Data ISO (os dados trafegam como JSON pelos mocks) */
  createdAt: string;
}

export type NovaVagaInput = Pick<VagaType, "code" | "title" | "description" | "etapas">;

export interface UpdateEtapasInput {
  id: string;
  etapas: EtapaType[];
}
