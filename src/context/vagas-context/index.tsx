import { createContext, useMemo } from 'react';
import useSWR, { mutate as mutateCache } from 'swr';
import { FetchError, getFetcher, postFetcher, putFetcher } from 'src/api/global-fetcher';
import {
  AvaliacaoRequest,
  AvaliacaoResponse,
  CandidatoResponse,
  CreateCandidatoRequest,
  CreateVagaRequest,
  EtapaResponse,
  EtapaType,
  VagaResponse,
  VagaStatusAlteravel,
  VagaType,
} from 'src/types/apps/vagas';

// ---------- Backend real: listagem e criação (Minhas vagas, Nova vaga) ----------

// O proxy do Vite encaminha /api/vagas para GET/POST /vagas do backend, com o JWT do global-fetcher.
const API_VAGAS_ENDPOINT = '/api/vagas';

export interface MinhasVagasContextType {
  vagas: VagaResponse[];
  loading: boolean;
  error: Error | undefined;
  addVaga: (vaga: CreateVagaRequest) => Promise<void>;
}

export const MinhasVagasContext = createContext<MinhasVagasContextType>({} as MinhasVagasContextType);

export const MinhasVagasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // O backend devolve o array direto, só com as vagas do recruiter autenticado.
  const { data, isLoading, error, mutate } = useSWR<VagaResponse[], Error>(
    API_VAGAS_ENDPOINT,
    getFetcher,
  );

  // Mais recente primeiro: o backend não garante ordem.
  const vagas = useMemo(
    () => [...(data ?? [])].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [data],
  );

  // Os erros são propagados para que a tela decida o que mostrar ao recruiter.
  // O backend cria as etapas padrão; a lista é recarregada para incluir a vaga nova.
  const addVaga = async (vaga: CreateVagaRequest) => {
    await postFetcher(API_VAGAS_ENDPOINT, vaga);
    await mutate();
  };

  return (
    <MinhasVagasContext.Provider value={{ vagas, loading: isLoading, error, addVaga }}>
      {children}
    </MinhasVagasContext.Provider>
  );
};

// ---------- Backend real: detalhe da vaga, etapas (somente leitura) e candidatos ----------

// Etapa do backend no formato usado pelas telas: position → order, proposta → tipo FECHAMENTO.
const toEtapa = ({
  id,
  name,
  position,
  proposta,
  candidatesCount,
  reprovadosCount,
  chegaramCount,
  taxaReprovacao,
}: EtapaResponse): EtapaType => ({
  id,
  name,
  order: position,
  type: proposta ? 'FECHAMENTO' : 'PADRAO',
  candidatesCount,
  reprovadosCount,
  chegaramCount,
  taxaReprovacao,
});

export interface VagaDetail {
  vaga: VagaResponse | undefined;
  etapas: EtapaType[];
  loading: boolean;
  /** 404: a vaga não existe ou não pertence ao recruiter autenticado */
  notFound: boolean;
  error: Error | undefined;
  candidatos: CandidatoResponse[];
  candidatosLoading: boolean;
  candidatosError: Error | undefined;
  /** Candidatos reprovados da vaga, com a etapa da reprovação (GET /vagas/{id}/candidatos/reprovados) */
  reprovados: CandidatoResponse[];
  reprovadosLoading: boolean;
  reprovadosError: Error | undefined;
  /** Avaliações por etapa de todos os candidatos da vaga (GET /vagas/{id}/candidatos/avaliacoes) */
  avaliacoes: AvaliacaoResponse[];
  avaliacoesLoading: boolean;
  /** Erros (400 com errors por campo, 409 com message) chegam como FetchError para a tela tratar. */
  addCandidato: (candidato: CreateCandidatoRequest) => Promise<void>;
  /** Move o candidato para a próxima etapa. 409 { message } chega como FetchError. */
  advanceCandidato: (candidato: CandidatoResponse) => Promise<void>;
  /** Reprova o candidato na etapa atual. 409 { message } chega como FetchError. */
  reprovarCandidato: (candidato: CandidatoResponse) => Promise<void>;
  /** Altera o status da vaga (PUT /vagas/{id}/status). Erros chegam como FetchError para a tela tratar. */
  changeStatus: (status: VagaStatusAlteravel) => Promise<void>;
  /** Dá a nota (1 a 5) do candidato na etapa em que ele está. Em erro a nota anterior volta e o erro é propagado. */
  avaliarCandidato: (candidato: CandidatoResponse, rating: number) => Promise<void>;
}

// GET /vagas/{id}, /etapas, /candidatos e /candidatos/reprovados em paralelo; o backend só devolve vagas do recruiter autenticado.
export const useVagaDetail = (id: string | undefined): VagaDetail => {
  const vagaEndpoint = id ? `${API_VAGAS_ENDPOINT}/${encodeURIComponent(id)}` : null;
  const vagaResult = useSWR<VagaResponse, Error>(vagaEndpoint, getFetcher);
  const etapasResult = useSWR<EtapaResponse[], Error>(
    vagaEndpoint && `${vagaEndpoint}/etapas`,
    getFetcher,
  );

  const candidatosEndpoint = vagaEndpoint && `${vagaEndpoint}/candidatos`;
  const candidatosResult = useSWR<CandidatoResponse[], Error>(candidatosEndpoint, getFetcher);
  // /candidatos só devolve os ativos; os reprovados vêm de um endpoint próprio.
  const reprovadosResult = useSWR<CandidatoResponse[], Error>(
    candidatosEndpoint && `${candidatosEndpoint}/reprovados`,
    getFetcher,
  );
  // Uma única requisição traz as avaliações de todos os candidatos: os cards não buscam nada por conta própria.
  const avaliacoesResult = useSWR<AvaliacaoResponse[], Error>(
    candidatosEndpoint && `${candidatosEndpoint}/avaliacoes`,
    getFetcher,
  );

  const etapas = useMemo(() => (etapasResult.data ?? []).map(toEtapa), [etapasResult.data]);
  const error = vagaResult.error ?? etapasResult.error;

  // O backend coloca o candidato na primeira etapa: candidatos e contagens das etapas são recarregados.
  const addCandidato = async (candidato: CreateCandidatoRequest) => {
    if (!candidatosEndpoint) return;
    await postFetcher(candidatosEndpoint, candidato);
    await Promise.all([candidatosResult.mutate(), etapasResult.mutate()]);
  };

  // O backend espera a etapa em que o candidato está hoje (não a próxima): se ela mudou, responde 409.
  // Candidatos e etapas são recarregados mesmo em erro, para a tela não ficar com estado desatualizado.
  const advanceCandidato = async (candidato: CandidatoResponse) => {
    if (!candidatosEndpoint) return;
    try {
      await postFetcher(`${candidatosEndpoint}/${encodeURIComponent(candidato.id)}/avancar`, {
        etapaId: candidato.etapaId,
      });
    } finally {
      await Promise.all([candidatosResult.mutate(), etapasResult.mutate()]);
    }
  };

  // Mesmo contrato do avanço: o backend exige a etapa atual do candidato e responde 409 se ela mudou.
  // O candidato reprovado sai dos ativos e entra nos reprovados: as duas listas e as contagens das etapas
  // são recarregadas do backend.
  const reprovarCandidato = async (candidato: CandidatoResponse) => {
    if (!candidatosEndpoint) return;
    try {
      await postFetcher(`${candidatosEndpoint}/${encodeURIComponent(candidato.id)}/reprovar`, {
        etapaId: candidato.etapaId,
      });
    } finally {
      await Promise.all([
        candidatosResult.mutate(),
        reprovadosResult.mutate(),
        etapasResult.mutate(),
      ]);
    }
  };

  // O status exibido é sempre o do backend: a vaga é recarregada mesmo em erro, e a lista de Minhas vagas
  // é invalidada para não mostrar o status antigo ao voltar.
  const changeStatus = async (status: VagaStatusAlteravel) => {
    if (!vagaEndpoint) return;
    try {
      await putFetcher(`${vagaEndpoint}/status`, { status });
    } finally {
      await Promise.all([vagaResult.mutate(), mutateCache(API_VAGAS_ENDPOINT)]);
    }
  };

  // Atualização otimista: a nota aparece na hora e o PUT segue em segundo plano. Em sucesso só as avaliações
  // são recarregadas; em erro o SWR restaura a lista anterior e o erro sobe para o card.
  const avaliarCandidato = async (candidato: CandidatoResponse, rating: number) => {
    if (!candidatosEndpoint) return;
    const { id: candidatoId, etapaId } = candidato;
    const daEtapa = (avaliacao: AvaliacaoResponse) =>
      avaliacao.candidatoId === candidatoId && avaliacao.etapaId === etapaId;
    const atual = (avaliacoesResult.data ?? []).find(daEtapa);
    // O PUT substitui a avaliação inteira: a observação já salva é reenviada para não ser apagada.
    const request: AvaliacaoRequest = { rating, observacao: atual?.observacao ?? null };

    await avaliacoesResult.mutate(
      putFetcher(
        `${candidatosEndpoint}/${encodeURIComponent(candidatoId)}/etapas/${encodeURIComponent(etapaId)}/avaliacao`,
        request,
      ),
      {
        optimisticData: (current = []) => [
          ...current.filter((avaliacao) => !daEtapa(avaliacao)),
          {
            id: '',
            etapaNome: '',
            createdAt: '',
            updatedAt: '',
            ...atual,
            candidatoId,
            etapaId,
            rating,
            observacao: request.observacao,
          },
        ],
        populateCache: false,
        rollbackOnError: true,
        revalidate: true,
      },
    );
  };

  return {
    vaga: vagaResult.data,
    etapas,
    loading: vagaResult.isLoading || etapasResult.isLoading,
    notFound: !id || (error instanceof FetchError && error.status === 404),
    error,
    candidatos: candidatosResult.data ?? [],
    candidatosLoading: candidatosResult.isLoading,
    candidatosError: candidatosResult.error,
    reprovados: reprovadosResult.data ?? [],
    reprovadosLoading: reprovadosResult.isLoading,
    reprovadosError: reprovadosResult.error,
    avaliacoes: avaliacoesResult.data ?? [],
    avaliacoesLoading: avaliacoesResult.isLoading,
    addCandidato,
    advanceCandidato,
    reprovarCandidato,
    changeStatus,
    avaliarCandidato,
  };
};

// ---------- Mock (MSW): edição de etapas, ainda não integrada ao backend ----------

const VAGAS_ENDPOINT = '/api/data/vagas';

interface VagasResponse {
  status: number;
  msg: string;
  data: VagaType[];
}

export interface VagasContextType {
  vagas: VagaType[];
  loading: boolean;
  error: Error | undefined;
  updateEtapas: (id: string, etapas: EtapaType[]) => Promise<void>;
}

export const VagasContext = createContext<VagasContextType>({} as VagasContextType);

export const VagasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading, error, mutate } = useSWR<VagasResponse, Error>(
    VAGAS_ENDPOINT,
    getFetcher,
  );

  const updateEtapas = async (id: string, etapas: EtapaType[]) => {
    await mutate(putFetcher(`${VAGAS_ENDPOINT}/etapas`, { id, etapas }), { revalidate: false });
  };

  return (
    <VagasContext.Provider
      value={{
        vagas: data?.data ?? [],
        loading: isLoading,
        error,
        updateEtapas,
      }}
    >
      {children}
    </VagasContext.Provider>
  );
};
