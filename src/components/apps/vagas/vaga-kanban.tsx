import { useMemo, useState } from "react";
import { ArrowRight, ExternalLink, Flag, Star, UserX } from "lucide-react";
import { FetchError } from "src/api/global-fetcher";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "src/components/ui/alert-dialog";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { ScrollArea, ScrollBar } from "src/components/ui/scroll-area";
import { isEtapaFechamento } from "src/lib/vagas";
import { cn } from "src/lib/utils";
import { AvaliacaoResponse, CandidatoResponse, EtapaType } from "src/types/apps/vagas";

const MAX_RATING = 5;

// O backend aceita qualquer texto no LinkedIn: só vira link quando for http(s).
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value.trim());

// Avaliações indexadas por candidato + etapa: cada card só enxerga a nota da etapa em que o candidato está.
const avaliacaoKey = (candidatoId: string, etapaId: string) => `${candidatoId}:${etapaId}`;

// Nota do candidato na etapa atual (não é o `rating` geral do cadastro). Clicar em uma estrela salva na hora;
// continua disponível com a vaga pausada, cancelada ou fechada.
const AvaliacaoEtapa = ({
  candidato,
  etapa,
  rating,
  onAvaliar,
}: {
  candidato: CandidatoResponse;
  etapa: EtapaType;
  /** Nota de 1 a 5 nesta etapa; ausente enquanto não houver avaliação */
  rating: number | undefined;
  onAvaliar: (candidato: CandidatoResponse, rating: number) => Promise<void>;
}) => {
  const [error, setError] = useState<string>();

  const handleClick = async (value: number) => {
    if (value === rating) return;
    setError(undefined);
    try {
      // A estrela muda antes da resposta; se o backend recusar, a nota anterior volta.
      await onAvaliar(candidato, value);
    } catch {
      setError("Não foi possível salvar a avaliação. Tente novamente.");
    }
  };

  return (
    <div className="mt-1 flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">Avaliação desta etapa</p>
      <div
        role="group"
        aria-label={`Avaliação de ${candidato.name} em ${etapa.name}: ${
          rating ? `${rating} de ${MAX_RATING}` : "sem avaliação"
        }`}
        className="flex items-center gap-0.5"
      >
        {Array.from({ length: MAX_RATING }, (_, index) => {
          const value = index + 1;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleClick(value)}
              aria-label={`Dar nota ${value} de ${MAX_RATING}`}
              aria-pressed={value === rating}
              className="cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Star
                aria-hidden
                className={cn(
                  "size-5",
                  rating && value <= rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/40 hover:text-amber-400",
                )}
              />
            </button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

// 409 traz a regra que impediu o avanço (ex.: vaga pausada, candidato já movido); o resto é genérico.
const toAdvanceError = (err: unknown) => {
  if (err instanceof FetchError) {
    const message = (err.body as { message?: string } | undefined)?.message;
    if (err.status === 409 && message) return `${message}.`;
    if (err.status === 404) return "Candidato não encontrado. A lista foi atualizada.";
  }
  return "Não foi possível avançar o candidato. Tente novamente.";
};

const AdvanceButton = ({
  candidato,
  nextEtapa,
  onAdvance,
  disabled,
}: {
  candidato: CandidatoResponse;
  nextEtapa: EtapaType;
  onAdvance: (candidato: CandidatoResponse) => Promise<void>;
  disabled?: boolean;
}) => {
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string>();

  const handleClick = async () => {
    if (advancing) return;
    setAdvancing(true);
    setError(undefined);
    try {
      // Em sucesso o card sai desta coluna ao recarregar os candidatos e este componente é desmontado.
      await onAdvance(candidato);
    } catch (err) {
      setError(toAdvanceError(err));
      setAdvancing(false);
    }
  };

  return (
    <div className="mt-1 flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleClick}
        disabled={disabled || advancing}
        aria-label={`Avançar ${candidato.name} para ${nextEtapa.name}`}
        title={`Avançar para ${nextEtapa.name}`}
      >
        {advancing ? "Avançando..." : "Avançar"}
        {!advancing && <ArrowRight />}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
};

// 409 traz a regra que impediu a reprovação (ex.: vaga pausada, candidato já movido); o resto é genérico.
const toReprovarError = (err: unknown) => {
  if (err instanceof FetchError) {
    const message = (err.body as { message?: string } | undefined)?.message;
    if (err.status === 409 && message) return `${message}.`;
    if (err.status === 404) return "Candidato não encontrado. A lista foi atualizada.";
  }
  return "Não foi possível reprovar o candidato. Tente novamente.";
};

const ReprovarButton = ({
  candidato,
  etapa,
  onReprovar,
  disabled,
}: {
  candidato: CandidatoResponse;
  etapa: EtapaType;
  onReprovar: (candidato: CandidatoResponse) => Promise<void>;
  disabled?: boolean;
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reprovando, setReprovando] = useState(false);
  const [error, setError] = useState<string>();

  const handleConfirm = async () => {
    if (reprovando) return;
    setReprovando(true);
    setError(undefined);
    try {
      // Em sucesso o card sai do Kanban ao recarregar os candidatos e este componente é desmontado.
      await onReprovar(candidato);
    } catch (err) {
      setError(toReprovarError(err));
      setReprovando(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="w-full"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled || reprovando}
        aria-label={`Reprovar ${candidato.name}`}
      >
        {reprovando ? "Reprovando..." : "Reprovar"}
        {!reprovando && <UserX />}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Durante a requisição o diálogo não fecha: evita um segundo envio. */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !reprovando && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reprovar candidato?</AlertDialogTitle>
            <AlertDialogDescription>
              {candidato.name} será reprovado na etapa "{etapa.name}" e sairá do funil e do Kanban
              da vaga.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reprovando}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={reprovando}
            >
              {reprovando ? "Reprovando..." : "Reprovar"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const CandidatoCard = ({
  candidato,
  etapa,
  nextEtapa,
  onAdvance,
  onReprovar,
  rating,
  onAvaliar,
  disabled,
}: {
  candidato: CandidatoResponse;
  /** Etapa atual do candidato */
  etapa: EtapaType;
  /** Próxima etapa configurada; ausente na última etapa (Proposta) */
  nextEtapa: EtapaType | undefined;
  onAdvance: (candidato: CandidatoResponse) => Promise<void>;
  onReprovar: (candidato: CandidatoResponse) => Promise<void>;
  /** Nota do candidato na etapa atual; ausente enquanto não houver avaliação */
  rating: number | undefined;
  onAvaliar: (candidato: CandidatoResponse, rating: number) => Promise<void>;
  /** Bloqueia só Avançar e Reprovar: a avaliação continua liberada */
  disabled?: boolean;
}) => (
  <li className="flex flex-col gap-1.5 rounded-lg border bg-card p-3 shadow-xs">
    <p className="text-sm font-medium break-words">{candidato.name}</p>
    <p className="text-xs text-muted-foreground break-words">{candidato.stack}</p>
    {candidato.linkedin &&
      (isHttpUrl(candidato.linkedin) ? (
        <a
          href={candidato.linkedin.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          LinkedIn
          <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : (
        <p className="text-xs text-muted-foreground break-all">{candidato.linkedin}</p>
      ))}
    <AvaliacaoEtapa candidato={candidato} etapa={etapa} rating={rating} onAvaliar={onAvaliar} />
    {nextEtapa && (
      <AdvanceButton
        candidato={candidato}
        nextEtapa={nextEtapa}
        onAdvance={onAdvance}
        disabled={disabled}
      />
    )}
    {/* O backend não permite reprovar na etapa de proposta. */}
    {!isEtapaFechamento(etapa) && (
      <ReprovarButton
        candidato={candidato}
        etapa={etapa}
        onReprovar={onReprovar}
        disabled={disabled}
      />
    )}
  </li>
);

interface VagaKanbanProps {
  /** Etapas já ordenadas por `order` */
  etapas: EtapaType[];
  candidatos: CandidatoResponse[];
  onAdvance: (candidato: CandidatoResponse) => Promise<void>;
  onReprovar: (candidato: CandidatoResponse) => Promise<void>;
  /** Avaliações por etapa de todos os candidatos da vaga, vindas de uma única requisição */
  avaliacoes: AvaliacaoResponse[];
  onAvaliar: (candidato: CandidatoResponse, rating: number) => Promise<void>;
  /** Vaga que não está ATUANDO: os candidatos continuam visíveis, mas Avançar e Reprovar ficam bloqueados */
  disabled?: boolean;
}

// Uma coluna por etapa, só com candidatos ativos na etapa atual. Sem drag and drop:
// a movimentação virá pelo botão Avançar.
const VagaKanban = ({
  etapas,
  candidatos,
  onAdvance,
  onReprovar,
  avaliacoes,
  onAvaliar,
  disabled,
}: VagaKanbanProps) => {
  const ativos = candidatos.filter((candidato) => !candidato.reprovado);
  const ratings = useMemo(
    () =>
      new Map(
        avaliacoes.map((avaliacao) => [
          avaliacaoKey(avaliacao.candidatoId, avaliacao.etapaId),
          avaliacao.rating,
        ]),
      ),
    [avaliacoes],
  );

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-4 pb-3">
        {etapas.map((etapa, index) => {
          const nextEtapa = etapas[index + 1];
          const doEtapa = ativos.filter((candidato) => candidato.etapaId === etapa.id);
          return (
            <section
              key={etapa.id}
              aria-label={etapa.name}
              className="flex w-64 shrink-0 flex-col gap-3 rounded-xl bg-muted/50 p-3"
            >
              <header className="flex items-center gap-2">
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{etapa.name}</h3>
                {isEtapaFechamento(etapa) && (
                  <Flag className="size-3.5 shrink-0 text-muted-foreground" aria-label="Fechamento" />
                )}
                <Badge variant="secondary" className="tabular-nums">
                  {doEtapa.length}
                </Badge>
              </header>
              {doEtapa.length === 0 ? (
                <p className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground">
                  Nenhum candidato
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {doEtapa.map((candidato) => (
                    <CandidatoCard
                      key={candidato.id}
                      candidato={candidato}
                      etapa={etapa}
                      nextEtapa={nextEtapa}
                      onAdvance={onAdvance}
                      onReprovar={onReprovar}
                      rating={ratings.get(avaliacaoKey(candidato.id, candidato.etapaId))}
                      onAvaliar={onAvaliar}
                      disabled={disabled}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default VagaKanban;
