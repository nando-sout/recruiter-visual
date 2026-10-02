import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { FetchError } from "src/api/global-fetcher";
import { Alert, AlertDescription } from "src/components/ui/alert";
import { Button } from "src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "src/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { NativeSelect, NativeSelectOption } from "src/components/ui/native-select";
import { Textarea } from "src/components/ui/textarea";
import { CreateCandidatoRequest } from "src/types/apps/vagas";

type FormField = keyof CreateCandidatoRequest;
type FormValues = Record<FormField, string>;
type FormErrors = Partial<Record<FormField, string>>;

const EMPTY_FORM: FormValues = {
  name: "",
  stack: "",
  linkedin: "",
  rating: "",
  linkedinAbout: "",
  recruiterOpinion: "",
  technicalOpinion: "",
};

// O backend devolve só o complemento da mensagem ("é obrigatório"); o rótulo do campo vem daqui.
const FIELD_LABELS: Record<FormField, string> = {
  name: "Nome",
  stack: "Stack",
  linkedin: "LinkedIn",
  rating: "Avaliação",
  linkedinAbout: "Sobre no LinkedIn",
  recruiterOpinion: "Opinião do recruiter",
  technicalOpinion: "Opinião técnica",
};

const GENERIC_ERROR = "Não foi possível cadastrar o candidato. Tente novamente em instantes.";

// Campos opcionais vazios não são enviados; rating só é enviado quando escolhido (0 a 5).
const toRequest = (values: FormValues): CreateCandidatoRequest => {
  const optional = (value: string) => value.trim() || undefined;
  return {
    name: values.name.trim(),
    stack: values.stack.trim(),
    linkedin: optional(values.linkedin),
    rating: values.rating === "" ? undefined : Number(values.rating),
    linkedinAbout: optional(values.linkedinAbout),
    recruiterOpinion: optional(values.recruiterOpinion),
    technicalOpinion: optional(values.technicalOpinion),
  };
};

const validate = (values: FormValues): FormErrors => {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Informe o nome do candidato.";
  if (!values.stack.trim()) errors.stack = "Informe a stack do candidato.";
  return errors;
};

// 400 { message, errors } vira erro por campo; 409 { message } (ex.: vaga que não aceita candidatos) vai para o topo.
const toSubmitErrors = (err: unknown): { fields: FormErrors; form?: string } => {
  if (!(err instanceof FetchError)) return { fields: {}, form: GENERIC_ERROR };
  const body = err.body as { message?: string; errors?: Record<string, string> } | undefined;

  if (err.status === 400 && body?.errors) {
    const fields: FormErrors = {};
    for (const [field, message] of Object.entries(body.errors)) {
      if (field in FIELD_LABELS) {
        fields[field as FormField] = `${FIELD_LABELS[field as FormField]} ${message}.`;
      }
    }
    if (Object.keys(fields).length > 0) return { fields };
  }
  if (err.status === 409 && body?.message) return { fields: {}, form: body.message };
  return { fields: {}, form: GENERIC_ERROR };
};

interface CandidatoFormDialogProps {
  onSubmit: (candidato: CreateCandidatoRequest) => Promise<void>;
  /** Vaga que não está ATUANDO não aceita novos candidatos */
  disabled?: boolean;
}

const CandidatoFormDialog = ({ onSubmit, disabled }: CandidatoFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (submitting) return;
    setOpen(next);
    if (next) {
      setValues(EMPTY_FORM);
      setErrors({});
      setSubmitError(undefined);
    }
  };

  const setField = (field: FormField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    const validationErrors = validate(values);
    setErrors(validationErrors);
    setSubmitError(undefined);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(toRequest(values));
      setSubmitting(false);
      setOpen(false);
    } catch (err) {
      const { fields, form } = toSubmitErrors(err);
      setErrors(fields);
      setSubmitError(form);
      setSubmitting(false);
    }
  };

  const textField = (field: FormField, props: { placeholder?: string; required?: boolean }) => (
    <Field data-invalid={Boolean(errors[field])}>
      <FieldLabel htmlFor={`candidato-${field}`}>
        {FIELD_LABELS[field]}
        {props.required && " *"}
      </FieldLabel>
      <Input
        id={`candidato-${field}`}
        value={values[field]}
        onChange={(e) => setField(field, e.target.value)}
        aria-invalid={Boolean(errors[field])}
        placeholder={props.placeholder}
        disabled={submitting}
      />
      {errors[field] && <FieldError>{errors[field]}</FieldError>}
    </Field>
  );

  const longTextField = (field: FormField) => (
    <Field data-invalid={Boolean(errors[field])}>
      <FieldLabel htmlFor={`candidato-${field}`}>{FIELD_LABELS[field]}</FieldLabel>
      <Textarea
        id={`candidato-${field}`}
        value={values[field]}
        onChange={(e) => setField(field, e.target.value)}
        aria-invalid={Boolean(errors[field])}
        rows={3}
        disabled={submitting}
      />
      {errors[field] && <FieldError>{errors[field]}</FieldError>}
    </Field>
  );

  return (
    <>
      <Button type="button" onClick={() => handleOpenChange(true)} disabled={disabled}>
        <UserPlus />
        Cadastrar candidato
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle>Cadastrar candidato</DialogTitle>
              <DialogDescription>
                O candidato entra na primeira etapa da vaga. Campos com * são obrigatórios.
              </DialogDescription>
            </DialogHeader>

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <FieldGroup>
              {textField("name", { required: true, placeholder: "Ex.: João Silva" })}
              {textField("stack", { required: true, placeholder: "Ex.: Java, Spring" })}
              {textField("linkedin", { placeholder: "https://www.linkedin.com/in/..." })}
              <Field data-invalid={Boolean(errors.rating)}>
                <FieldLabel htmlFor="candidato-rating">{FIELD_LABELS.rating}</FieldLabel>
                <NativeSelect
                  id="candidato-rating"
                  value={values.rating}
                  onChange={(e) => setField("rating", e.target.value)}
                  aria-invalid={Boolean(errors.rating)}
                  disabled={submitting}
                  className="w-full sm:w-48"
                >
                  <NativeSelectOption value="">Sem avaliação</NativeSelectOption>
                  {[0, 1, 2, 3, 4, 5].map((rating) => (
                    <NativeSelectOption key={rating} value={String(rating)}>
                      {rating}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {errors.rating && <FieldError>{errors.rating}</FieldError>}
              </Field>
              {longTextField("linkedinAbout")}
              {longTextField("recruiterOpinion")}
              {longTextField("technicalOpinion")}
            </FieldGroup>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar candidato"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CandidatoFormDialog;
