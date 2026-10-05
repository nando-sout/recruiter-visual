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
  /** Candidatos reprovados nesta etapa, contados pelo backend */
  reprovadosCount: number;
  /** Candidatos que chegaram a esta etapa, contados pelo backend */
  chegaramCount: number;
  /** Percentual calculado pelo backend; null quando ninguém chegou à etapa */
  taxaReprovacao: number | null;
}

/** Dados do formulário de Nova vaga, validados na tela antes do envio. */
export interface NovaVagaInput {
  /** Código informado pelo recruiter: obrigatório, único e de formato livre */
  code: string;
  title: string;
  description: string;
  etapas: EtapaType[];
}

/**
 * Vaga como o backend devolve em GET /vagas, GET /vagas/{id} e POST /vagas (VagaResponse).
 * Não traz etapas: elas vêm de GET /vagas/{id}/etapas (EtapaResponse).
 */
export interface VagaResponse {
  id: string;
  code: string;
  title: string;
  description: string;
  status: VagaStatus;
  recruiterId: string;
  /** LocalDateTime do backend, sem fuso: "2026-09-29T12:50:57.727" */
  createdAt: string;
}

/** Etapa como o backend devolve em GET /vagas/{id}/etapas (EtapaResponse), já ordenada por position. */
export interface EtapaResponse {
  id: string;
  name: string;
  /** Posição da etapa, começando em 1 */
  position: number;
  /** Etapa de fechamento (Proposta) */
  proposta: boolean;
  /** Candidatos ativos hoje na etapa */
  candidatesCount: number;
  /** Candidatos reprovados nesta etapa */
  reprovadosCount: number;
  /** Candidatos que chegaram a esta etapa */
  chegaramCount: number;
  /** reprovadosCount / chegaramCount × 100, com uma casa decimal; null quando chegaramCount = 0 */
  taxaReprovacao: number | null;
}

/** Etapa enviada na criação da vaga: id e posição são do backend, que usa a ordem do array. */
export interface CreateEtapaRequest {
  name: string;
  /** Etapa de fechamento: exatamente uma, sempre a última */
  proposta: boolean;
}

/** Body aceito por POST /vagas (CreateVagaRequest). */
export type CreateVagaRequest = Pick<VagaResponse, "code" | "title" | "description"> & {
  etapas: CreateEtapaRequest[];
};

/** Status que o recruiter pode definir por PUT /vagas/{vagaId}/status. */
export type VagaStatusAlteravel = Exclude<VagaStatus, "FECHADA">;

/** Candidato como o backend devolve em GET/POST /vagas/{vagaId}/candidatos (CandidatoResponse). */
export interface CandidatoResponse {
  id: string;
  vagaId: string;
  /** Etapa atual do candidato */
  etapaId: string;
  name: string;
  linkedin: string | null;
  stack: string;
  /** 0 a 5 */
  rating: number | null;
  linkedinAbout: string | null;
  recruiterOpinion: string | null;
  technicalOpinion: string | null;
  reprovado: boolean;
  etapaReprovacaoId: string | null;
  etapaReprovacaoNome: string | null;
  /** LocalDateTime do backend, sem fuso */
  createdAt: string;
}

/**
 * Avaliação de um candidato em uma etapa, como o backend devolve em GET /vagas/{vagaId}/candidatos/avaliacoes.
 * Cada par candidato + etapa tem no máximo uma; não se confunde com o `rating` geral do cadastro.
 */
export interface AvaliacaoResponse {
  id: string;
  candidatoId: string;
  etapaId: string;
  etapaNome: string;
  /** 1 a 5 */
  rating: number;
  observacao: string | null;
  /** LocalDateTime do backend, sem fuso */
  createdAt: string;
  updatedAt: string;
}

/** Body aceito por PUT /vagas/{vagaId}/candidatos/{candidatoId}/etapas/{etapaId}/avaliacao. */
export interface AvaliacaoRequest {
  /** 1 a 5, obrigatória */
  rating: number;
  observacao: string | null;
}

/** Body aceito por POST /vagas/{vagaId}/candidatos (CreateCandidatoRequest). Sem etapaId: entra na primeira etapa. */
export interface CreateCandidatoRequest {
  name: string;
  stack: string;
  linkedin?: string;
  /** 0 a 5 */
  rating?: number;
  linkedinAbout?: string;
  recruiterOpinion?: string;
  technicalOpinion?: string;
}
