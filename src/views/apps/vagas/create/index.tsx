import { FormEvent, useContext, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import EtapasEditor from "src/components/apps/vagas/etapas-editor";
import VagaStatusBadge from "src/components/apps/vagas/vaga-status-badge";
import { Alert, AlertDescription, AlertTitle } from "src/components/ui/alert";
import { Button } from "src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "src/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { Textarea } from "src/components/ui/textarea";
import { VagasContext, VagasProvider } from "src/context/vagas-context";
import { cn } from "src/lib/utils";
import {
  NovaVagaErrors,
  VAGA_DESCRIPTION_MAX_LENGTH,
  VAGA_TITLE_MAX_LENGTH,
  createDefaultEtapas,
  validateNovaVaga,
} from "src/lib/vagas";
import { EtapaType, NovaVagaInput } from "src/types/apps/vagas";

const CharCount = ({ length, max }: { length: number; max: number }) => (
  <span className={cn("tabular-nums", length > max && "text-destructive")}>
    {length.toLocaleString("pt-BR")}/{max.toLocaleString("pt-BR")}
  </span>
);

const NovaVagaForm = () => {
  const { vagas, addVaga } = useContext(VagasContext);
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [etapas, setEtapas] = useState<EtapaType[]>(createDefaultEtapas);
  const [errors, setErrors] = useState<NovaVagaErrors>({});
  const [submitError, setSubmitError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof NovaVagaErrors) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input: NovaVagaInput = { code, title, description, etapas };
    const validationErrors = validateNovaVaga(
      input,
      vagas.map((vaga) => vaga.code),
    );
    setErrors(validationErrors);
    setSubmitError(false);
    if (Object.values(validationErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await addVaga(input);
      navigate("/apps/vagas");
    } catch {
      setSubmitError(true);
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-3">
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
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Nova vaga</h1>
          <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            A vaga será criada com o status
            <VagaStatusBadge status="ATUANDO" />
          </p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível criar a vaga</AlertTitle>
          <AlertDescription>Verifique os dados informados e tente novamente.</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da vaga</CardTitle>
          <CardDescription>Todos os campos são obrigatórios.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.code)}>
              <FieldLabel htmlFor="vaga-code">Código</FieldLabel>
              <Input
                id="vaga-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  clearError("code");
                }}
                aria-invalid={Boolean(errors.code)}
                placeholder="Ex.: VAGA-007"
                className="sm:max-w-xs"
              />
              {errors.code ? (
                <FieldError>{errors.code}</FieldError>
              ) : (
                <FieldDescription>Formato livre. Não pode se repetir entre suas vagas.</FieldDescription>
              )}
            </Field>

            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="vaga-title">Título</FieldLabel>
              <Input
                id="vaga-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearError("title");
                }}
                aria-invalid={Boolean(errors.title)}
                placeholder="Ex.: Desenvolvedor(a) Front-end Sênior"
              />
              <FieldDescription className="flex justify-between gap-4">
                <span className="text-destructive">{errors.title}</span>
                <CharCount length={title.trim().length} max={VAGA_TITLE_MAX_LENGTH} />
              </FieldDescription>
            </Field>

            <Field data-invalid={Boolean(errors.description)}>
              <FieldLabel htmlFor="vaga-description">Descrição</FieldLabel>
              <Textarea
                id="vaga-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearError("description");
                }}
                aria-invalid={Boolean(errors.description)}
                placeholder="Descreva as responsabilidades e o contexto da vaga"
                className="min-h-32"
              />
              <FieldDescription className="flex justify-between gap-4">
                <span className="text-destructive">{errors.description}</span>
                <CharCount length={description.trim().length} max={VAGA_DESCRIPTION_MAX_LENGTH} />
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Etapas</CardTitle>
          <CardDescription>
            A vaga já nasce com as etapas padrão. Adicione, renomeie, reordene ou exclua conforme
            o seu processo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EtapasEditor
            etapas={etapas}
            onChange={(next) => {
              setEtapas(next);
              clearError("etapas");
            }}
            error={errors.etapas}
            disabled={submitting}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          size="lg"
          nativeButton={false}
          render={<Link to="/apps/vagas" />}
        >
          Cancelar
        </Button>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Criando vaga..." : "Criar vaga"}
        </Button>
      </div>
    </form>
  );
};

const NovaVaga = () => (
  <VagasProvider>
    <NovaVagaForm />
  </VagasProvider>
);

export default NovaVaga;
