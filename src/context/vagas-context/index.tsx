import { createContext } from 'react';
import useSWR from 'swr';
import { getFetcher, postFetcher, putFetcher } from 'src/api/global-fetcher';
import { EtapaType, NovaVagaInput, VagaType } from 'src/types/apps/vagas';

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
  addVaga: (vaga: NovaVagaInput) => Promise<void>;
  updateEtapas: (id: string, etapas: EtapaType[]) => Promise<void>;
}

export const VagasContext = createContext<VagasContextType>({} as VagasContextType);

export const VagasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading, error, mutate } = useSWR<VagasResponse, Error>(
    VAGAS_ENDPOINT,
    getFetcher,
  );

  // Os erros são propagados para que a tela decida o que mostrar ao recruiter.
  const addVaga = async (vaga: NovaVagaInput) => {
    await mutate(postFetcher(`${VAGAS_ENDPOINT}/add`, vaga), { revalidate: false });
  };

  const updateEtapas = async (id: string, etapas: EtapaType[]) => {
    await mutate(putFetcher(`${VAGAS_ENDPOINT}/etapas`, { id, etapas }), { revalidate: false });
  };

  return (
    <VagasContext.Provider
      value={{
        vagas: data?.data ?? [],
        loading: isLoading,
        error,
        addVaga,
        updateEtapas,
      }}
    >
      {children}
    </VagasContext.Provider>
  );
};
