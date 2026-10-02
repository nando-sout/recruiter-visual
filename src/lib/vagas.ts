import { v4 as uuidv4 } from "uuid";
import { EtapaType, NovaVagaInput, VagaStatus } from "src/types/apps/vagas";

export const VAGA_TITLE_MAX_LENGTH = 150;
export const VAGA_DESCRIPTION_MAX_LENGTH = 5000;

export const VAGA_STATUS_LABEL: Record<VagaStatus, string> = {
  ATUANDO: "Atuando",
  PAUSADA: "Pausada",
  FECHADA: "Fechada",
  CANCELADA: "Cancelada",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const formatVagaDate = (isoDate: string) => dateFormatter.format(new Date(isoDate));

const DEFAULT_ETAPAS: Pick<EtapaType, "name" | "type">[] = [
  { name: "Envio de Shortlist", type: "PADRAO" },
  { name: "Entrevista Liderança", type: "PADRAO" },
  { name: "Entrevista RH", type: "PADRAO" },
  { name: "Proposta", type: "FECHAMENTO" },
];

export const isEtapaFechamento = (etapa: EtapaType) => etapa.type === "FECHAMENTO";

/** Reescreve `order` a partir da posição no array (1, 2, 3...). */
export const withExplicitOrder = (etapas: EtapaType[]): EtapaType[] =>
  etapas.map((etapa, index) => ({ ...etapa, order: index + 1 }));

export const sortEtapas = (etapas: EtapaType[]): EtapaType[] =>
  [...etapas].sort((a, b) => a.order - b.order);

export const createEtapa = (name: string, order: number): EtapaType => ({
  id: uuidv4(),
  name,
  order,
  type: "PADRAO",
  candidatesCount: 0,
  reprovadosCount: 0,
  chegaramCount: 0,
  taxaReprovacao: null,
});

export const createDefaultEtapas = (): EtapaType[] =>
  DEFAULT_ETAPAS.map((etapa, index) => ({
    ...etapa,
    id: uuidv4(),
    order: index + 1,
    candidatesCount: 0,
    reprovadosCount: 0,
    chegaramCount: 0,
    taxaReprovacao: null,
  }));

export const countCandidates = (etapas: EtapaType[]) =>
  etapas.reduce((total, etapa) => total + etapa.candidatesCount, 0);

/** Comparação usada para garantir que o código da vaga seja único. */
export const normalizeVagaCode = (code: string) => code.trim().toLocaleLowerCase("pt-BR");

export const validateEtapas = (etapas: EtapaType[]): string | undefined => {
  if (etapas.some((etapa) => !etapa.name.trim())) {
    return "Todas as etapas precisam ter um nome.";
  }
  if (etapas.filter(isEtapaFechamento).length !== 1) {
    return "A vaga precisa ter exatamente uma etapa de fechamento.";
  }
  return undefined;
};

export type NovaVagaErrors = Partial<Record<keyof NovaVagaInput, string>>;

export const validateNovaVaga = (
  input: NovaVagaInput,
  existingCodes: string[],
): NovaVagaErrors => {
  const errors: NovaVagaErrors = {};
  const code = normalizeVagaCode(input.code);
  const title = input.title.trim();
  const description = input.description.trim();

  if (!code) {
    errors.code = "Informe o código da vaga.";
  } else if (existingCodes.some((existing) => normalizeVagaCode(existing) === code)) {
    errors.code = "Já existe uma vaga com este código.";
  }

  if (!title) {
    errors.title = "Informe o título da vaga.";
  } else if (title.length > VAGA_TITLE_MAX_LENGTH) {
    errors.title = `O título deve ter no máximo ${VAGA_TITLE_MAX_LENGTH} caracteres.`;
  }

  if (!description) {
    errors.description = "Informe a descrição da vaga.";
  } else if (description.length > VAGA_DESCRIPTION_MAX_LENGTH) {
    errors.description = `A descrição deve ter no máximo ${VAGA_DESCRIPTION_MAX_LENGTH.toLocaleString("pt-BR")} caracteres.`;
  }

  const etapasError = validateEtapas(input.etapas);
  if (etapasError) {
    errors.etapas = etapasError;
  }

  return errors;
};
