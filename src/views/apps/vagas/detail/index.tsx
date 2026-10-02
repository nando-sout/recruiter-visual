import { Link, useParams } from "react-router";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Flag, Users } from "lucide-react";
import CandidatoFormDialog from "src/components/apps/vagas/candidato-form-dialog";
import VagaFunil, {
  VagaFunilReprovados,
  VagaTaxaReprovacao,
} from "src/components/apps/vagas/vaga-funil";
import VagaKanban from "src/components/apps/vagas/vaga-kanban";
import VagaStatusActions from "src/components/apps/vagas/vaga-status-actions";
import VagaStatusBadge from "src/components/apps/vagas/vaga-status-badge";
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "src/components/ui/empty";
import { Skeleton } from "src/components/ui/skeleton";
import { useVagaDetail } from "src/context/vagas-context";
import { countCandidates, formatVagaDate, isEtapaFechamento, sortEtapas } from "src/lib/vagas";
import {
  AvaliacaoResponse,
  CandidatoResponse,
  EtapaType,
  VagaStatus,
} from "src/types/apps/vagas";

// Só a vaga ATUANDO aceita cadastro, avanço e reprovação: nos demais status a tela explica o bloqueio.
const BLOQUEIO_MESSAGE: Partial<Record<VagaStatus, string>> = {
  PAUSADA: "Processo suspenso: cadastro, avanço e reprovação de candidatos estão bloqueados.",
  CANCELADA: "Processo cancelado: a vaga está disponível apenas para consulta.",
  FECHADA: "Processo encerrado: a vaga está disponível apenas para consulta.",
};

const candidatesLabel = (count: number) => `${count} ${count === 1 ? "candidato" : "candidatos"}`;

// Somente leitura por enquanto: a edição de etapas ainda não usa os endpoints do backend.
const EtapasCard = ({ etapas }: { etapas: EtapaType[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Etapas</CardTitle>
      <CardDescription>A ordem das etapas define o funil e o Kanban da vaga.</CardDescription>
    </CardHeader>
    <CardContent>
      <ol className="flex flex-col gap-2">
        {sortEtapas(etapas).map((etapa) => (
          <li
            key={etapa.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2 sm:flex-nowrap"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums">
              {etapa.order}
            </span>
            <span className="min-w-0 flex-1 basis-40 truncate px-1 text-sm">{etapa.name}</span>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {isEtapaFechamento(etapa) && (
                <Badge variant="outline">
                  <Flag />
                  Fechamento
                </Badge>
              )}
              <span className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
                <Users className="size-3.5" />
                {candidatesLabel(etapa.candidatesCount)}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </CardContent>
  </Card>
);

// Funil e Kanban usam as mesmas etapas e a mesma lista de candidatos do backend; reprovados ficam de fora.
const PipelineCards = ({
  etapas,
  candidatos,
  loading,
  error,
  onAdvance,
  onReprovar,
  avaliacoes,
  onAvaliar,
  bloqueada,
}: {
  etapas: EtapaType[];
  candidatos: CandidatoResponse[];
  loading: boolean;
  error: Error | undefined;
  onAdvance: (candidato: CandidatoResponse) => Promise<void>;
  onReprovar: (candidato: CandidatoResponse) => Promise<void>;
  avaliacoes: AvaliacaoResponse[];
  onAvaliar: (candidato: CandidatoResponse, rating: number) => Promise<void>;
  /** Vaga que não está ATUANDO: Avançar e Reprovar ficam bloqueados */
  bloqueada: boolean;
}) => {
  if (loading) {
    return (
      <>
        <Skeleton className="h-48" />
        <Skeleton className="h-72" />
      </>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar os candidatos</AlertTitle>
        <AlertDescription>Recarregue a página e tente novamente.</AlertDescription>
      </Alert>
    );
  }

  const ordered = sortEtapas(etapas);
  return (
    <>
      {/* Lado a lado em telas grandes; min-w-0 deixa os gráficos encolherem dentro da grade. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Funil</CardTitle>
            <CardDescription>Candidatos ativos em cada etapa da vaga.</CardDescription>
          </CardHeader>
          <CardContent>
            <VagaFunil etapas={ordered} candidatos={candidatos} />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-destructive">Funil de reprovados</CardTitle>
            <CardDescription>Candidatos reprovados em cada etapa da vaga.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <VagaFunilReprovados etapas={ordered} />
            <div className="border-t pt-4">
              <VagaTaxaReprovacao etapas={ordered} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kanban</CardTitle>
          <CardDescription>Cada candidato ativo aparece na etapa em que está hoje.</CardDescription>
        </CardHeader>
        <CardContent>
          <VagaKanban
            etapas={ordered}
            candidatos={candidatos}
            onAdvance={onAdvance}
            onReprovar={onReprovar}
            avaliacoes={avaliacoes}
            onAvaliar={onAvaliar}
            disabled={bloqueada}
          />
        </CardContent>
      </Card>
    </>
  );
};

// Lista vinda de GET /vagas/{id}/candidatos/reprovados: quem foi reprovado e em qual etapa.
const ReprovadosCard = ({
  reprovados,
  loading,
  error,
}: {
  reprovados: CandidatoResponse[];
  loading: boolean;
  error: Error | undefined;
}) => {
  if (loading) {
    return <Skeleton className="h-32" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar os reprovados</AlertTitle>
        <AlertDescription>Recarregue a página e tente novamente.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reprovados ({reprovados.length})</CardTitle>
        <CardDescription>Candidatos reprovados e a etapa em que isso aconteceu.</CardDescription>
      </CardHeader>
      <CardContent>
        {reprovados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum candidato reprovado.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reprovados.map((candidato) => (
              <li
                key={candidato.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg border bg-card p-2"
              >
                <span className="min-w-0 px-1 text-sm font-medium break-words">
                  {candidato.name}
                </span>
                {candidato.etapaReprovacaoNome && (
                  <span className="px-1 text-xs text-muted-foreground">
                    Reprovado em: {candidato.etapaReprovacaoNome}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

const VagaDetailContent = () => {
  const { id } = useParams();
  const {
    vaga,
    etapas,
    loading,
    notFound,
    error,
    candidatos,
    candidatosLoading,
    candidatosError,
    reprovados,
    reprovadosLoading,
    reprovadosError,
    avaliacoes,
    avaliacoesLoading,
    addCandidato,
    advanceCandidato,
    reprovarCandidato,
    changeStatus,
    avaliarCandidato,
  } = useVagaDetail(id);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  // 404 do backend: a vaga não existe ou pertence a outro recruiter.
  if (notFound) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BriefcaseBusiness />
          </EmptyMedia>
          <EmptyTitle>Vaga não encontrada</EmptyTitle>
          <EmptyDescription>
            Esta vaga não existe ou não pertence a você. Volte para Minhas vagas e escolha outra.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (error || !vaga) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar a vaga</AlertTitle>
        <AlertDescription>Recarregue a página e tente novamente.</AlertDescription>
      </Alert>
    );
  }

  // O status do backend é a fonte da verdade para liberar as ações de candidatos.
  const bloqueada = vaga.status !== "ATUANDO";
  const bloqueioMessage = BLOQUEIO_MESSAGE[vaga.status];

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {vaga.code}
            </Badge>
            <VagaStatusBadge status={vaga.status} />
            <VagaStatusActions status={vaga.status} onChangeStatus={changeStatus} />
          </div>
          <CardTitle className="text-xl font-semibold">{vaga.title}</CardTitle>
          <CardAction>
            <CandidatoFormDialog onSubmit={addCandidato} disabled={bloqueada} />
          </CardAction>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {countCandidates(etapas)} candidatos
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              Criada em {formatVagaDate(vaga.createdAt)}
            </span>
          </div>
          {bloqueioMessage && <p className="text-sm text-muted-foreground">{bloqueioMessage}</p>}
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-line text-foreground">{vaga.description}</p>
        </CardContent>
      </Card>

      <EtapasCard etapas={etapas} />

      <PipelineCards
        etapas={etapas}
        candidatos={candidatos}
        // As avaliações entram no carregamento para os cards não aparecerem com estrelas vazias e depois mudarem.
        loading={candidatosLoading || avaliacoesLoading}
        error={candidatosError}
        onAdvance={advanceCandidato}
        onReprovar={reprovarCandidato}
        avaliacoes={avaliacoes}
        onAvaliar={avaliarCandidato}
        bloqueada={bloqueada}
      />

      <ReprovadosCard
        reprovados={reprovados}
        loading={reprovadosLoading}
        error={reprovadosError}
      />
    </div>
  );
};

const VagaDetail = () => (
  <div className="flex flex-col gap-6">
    <Button
      variant="ghost"
      size="sm"
      className="w-fit"
      nativeButton={false}
      render={<Link to="/apps/vagas" />}
    >
      <ArrowLeft />
      Minhas vagas
    </Button>
    <VagaDetailContent />
  </div>
);

export default VagaDetail;
