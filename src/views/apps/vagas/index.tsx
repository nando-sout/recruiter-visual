import { useContext, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ListOrdered,
  Plus,
  Search,
  Users,
} from "lucide-react";
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
import { Input } from "src/components/ui/input";
import { Skeleton } from "src/components/ui/skeleton";
import VagaStatusBadge from "src/components/apps/vagas/vaga-status-badge";
import { VagasContext, VagasProvider } from "src/context/vagas-context";
import { countCandidates, formatVagaDate } from "src/lib/vagas";
import { VagaType } from "src/types/apps/vagas";

const VagaCard = ({ vaga }: { vaga: VagaType }) => (
  <Card className="h-full">
    <CardHeader>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono">
          {vaga.code}
        </Badge>
        <VagaStatusBadge status={vaga.status} />
      </div>
      <CardTitle className="text-base font-semibold">{vaga.title}</CardTitle>
      <CardDescription className="line-clamp-2">{vaga.description}</CardDescription>
    </CardHeader>
    <CardContent className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Users className="size-4" />
        {countCandidates(vaga.etapas)} candidatos
      </span>
      <span className="flex items-center gap-1.5">
        <ListOrdered className="size-4" />
        {vaga.etapas.length} etapas
      </span>
      <span className="flex items-center gap-1.5">
        <CalendarDays className="size-4" />
        Criada em {formatVagaDate(vaga.createdAt)}
      </span>
    </CardContent>
    <CardFooter className="justify-end">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link to={`/apps/vagas/${vaga.id}`} />}
      >
        Abrir vaga
        <ArrowRight className="size-4" />
      </Button>
    </CardFooter>
  </Card>
);

const VagasList = () => {
  const { vagas, loading, error } = useContext(VagasContext);
  const [search, setSearch] = useState("");

  const filteredVagas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vagas;
    return vagas.filter((vaga) => vaga.code.toLowerCase().includes(term));
  }, [search, vagas]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-52" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Não foi possível carregar as vagas</AlertTitle>
        <AlertDescription>Recarregue a página e tente novamente.</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="Buscar por código da vaga"
          placeholder="Buscar por código da vaga"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-8"
        />
      </div>

      {filteredVagas.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredVagas.map((vaga) => (
            <VagaCard key={vaga.id} vaga={vaga} />
          ))}
        </div>
      ) : (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BriefcaseBusiness />
            </EmptyMedia>
            <EmptyTitle>Nenhuma vaga encontrada</EmptyTitle>
            <EmptyDescription>
              {search.trim()
                ? `Não encontramos nenhuma vaga com o código "${search.trim()}". Confira o código informado e tente novamente.`
                : "Você ainda não tem vagas. Crie a primeira para começar."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </>
  );
};

const MinhasVagas = () => (
  <VagasProvider>
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Minhas vagas</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral das vagas sob sua responsabilidade e de seus candidatos.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link to="/apps/vagas/create" />}
        >
          <Plus className="size-4" />
          Nova vaga
        </Button>
      </div>

      <VagasList />
    </div>
  </VagasProvider>
);

export default MinhasVagas;
