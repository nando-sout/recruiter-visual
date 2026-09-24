import { useContext, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Users } from "lucide-react";
import EtapasEditor from "src/components/apps/vagas/etapas-editor";
import VagaStatusBadge from "src/components/apps/vagas/vaga-status-badge";
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { VagasContext, VagasProvider } from "src/context/vagas-context";
import { countCandidates, formatVagaDate, sortEtapas, validateEtapas } from "src/lib/vagas";
import { EtapaType, VagaType } from "src/types/apps/vagas";

// O mock salva os nomes sem espaços nas pontas, então a comparação também ignora esses espaços.
const etapasSignature = (etapas: EtapaType[]) =>
  JSON.stringify(etapas.map(({ id, name, order }) => [id, name.trim(), order]));

const EtapasCard = ({ vaga }: { vaga: VagaType }) => {
  const { updateEtapas } = useContext(VagasContext);
  const [draft, setDraft] = useState(() => sortEtapas(vaga.etapas));
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const dirty = etapasSignature(draft) !== etapasSignature(sortEtapas(vaga.etapas));

  const handleSave = async () => {
    const validationError = validateEtapas(draft);
    setError(validationError);
    setSaveFailed(false);
    if (validationError) return;

    setSaving(true);
    try {
      await updateEtapas(vaga.id, draft);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(sortEtapas(vaga.etapas));
    setError(undefined);
    setSaveFailed(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Etapas</CardTitle>
        <CardDescription>
          Adicione, renomeie, reordene ou exclua etapas. As alterações só valem depois de salvas.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {saveFailed && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível salvar as etapas</AlertTitle>
            <AlertDescription>Verifique as alterações e tente novamente.</AlertDescription>
          </Alert>
        )}
        <EtapasEditor
          etapas={draft}
          onChange={(next) => {
            setDraft(next);
            setError(undefined);
          }}
          error={error}
          showCandidates
          disabled={saving}
        />
      </CardContent>
      <CardFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleDiscard}
          disabled={!dirty || saving}
          className="w-full sm:w-auto"
        >
          Descartar alterações
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={!dirty || saving}
          className="w-full sm:w-auto"
        >
          {saving ? "Salvando..." : "Salvar etapas"}
        </Button>
      </CardFooter>
    </Card>
  );
};

const VagaDetailContent = () => {
  const { id } = useParams();
  const { vagas, loading, error } = useContext(VagasContext);
  const vaga = vagas.find((item) => item.id === id);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar a vaga</AlertTitle>
        <AlertDescription>Recarregue a página e tente novamente.</AlertDescription>
      </Alert>
    );
  }

  if (!vaga) {
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

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {vaga.code}
            </Badge>
            <VagaStatusBadge status={vaga.status} />
          </div>
          <CardTitle className="text-xl font-semibold">{vaga.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {countCandidates(vaga.etapas)} candidatos
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              Criada em {formatVagaDate(vaga.createdAt)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-line text-foreground">{vaga.description}</p>
        </CardContent>
      </Card>

      <EtapasCard key={vaga.id} vaga={vaga} />
    </div>
  );
};

const VagaDetail = () => (
  <VagasProvider>
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
  </VagasProvider>
);

export default VagaDetail;
