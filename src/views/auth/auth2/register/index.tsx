import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { register } from "@/api/auth/auth-api";
import { FetchError } from "@/api/global-fetcher";
import { AuthShowcase, BrandMark } from "../auth-showcase";
import { PasswordInput } from "../password-input";

type FieldName = "name" | "email" | "password" | "confirmPassword";
type FieldErrors = Partial<Record<FieldName, string>>;

// O backend devolve só o complemento da mensagem ("é obrigatório"); o rótulo do campo vem daqui.
const FIELD_LABELS: Record<Exclude<FieldName, "confirmPassword">, string> = {
  name: "Nome",
  email: "E-mail",
  password: "Senha",
};

const GENERIC_ERROR = "Não foi possível criar seu acesso agora. Tente novamente em instantes.";

// 400 { message, errors } e 409 { message } do POST /auth/register viram erros por campo;
// qualquer outra falha fica na mensagem genérica, como no login.
const toSubmitErrors = (err: unknown): { fields: FieldErrors; form?: string } => {
  if (!(err instanceof FetchError)) return { fields: {}, form: GENERIC_ERROR };
  const body = err.body as { message?: string; errors?: Record<string, string> } | undefined;

  if (err.status === 400 && body?.errors) {
    const fields: FieldErrors = {};
    for (const [field, message] of Object.entries(body.errors)) {
      if (field in FIELD_LABELS) {
        fields[field as keyof typeof FIELD_LABELS] = `${FIELD_LABELS[field as keyof typeof FIELD_LABELS]} ${message}.`;
      }
    }
    return Object.keys(fields).length > 0
      ? { fields }
      : { fields: {}, form: "Dados inválidos. Verifique os campos e tente novamente." };
  }
  if (err.status === 409) {
    return { fields: { email: body?.message ?? "Este e-mail já está cadastrado" } };
  }
  return { fields: {}, form: GENERIC_ERROR };
};

const BoxedRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: FieldName) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(undefined);

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "As senhas não coincidem." });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      // confirmPassword fica só no formulário; nenhum token é criado: o acesso depende da confirmação do e-mail.
      const response = await register({ name: name.trim(), email: email.trim(), password });
      // A tela de confirmação usa o e-mail como o backend o gravou (normalizado) para validar o código.
      navigate("/auth/auth2/two-steps", { state: { email: response.email } });
    } catch (err) {
      const { fields, form } = toSubmitErrors(err);
      setFieldErrors(fields);
      setError(form);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <AuthShowcase />

      {/* Register form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center">
            <BrandMark />
          </div>

          <Card className="w-full border-none shadow-lg p-6 sm:p-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-foreground">
                Criar seu acesso
              </h2>
              <p className="text-sm text-muted-foreground">
                Preencha seus dados para começar a usar o Recruiter Visual.
              </p>
            </div>

              <form className="space-y-6 w-full" onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Nome
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Digite seu nome"
                      required
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        clearFieldError("name");
                      }}
                      aria-invalid={Boolean(fieldErrors.name)}
                      disabled={submitting}
                    />
                    {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      E-mail
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="voce@email.com"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        clearFieldError("email");
                      }}
                      aria-invalid={Boolean(fieldErrors.email)}
                      disabled={submitting}
                    />
                    {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="password"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Senha
                    </Label>
                    <PasswordInput
                      id="password"
                      autoComplete="new-password"
                      placeholder="Crie uma senha"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError("password");
                      }}
                      aria-invalid={Boolean(fieldErrors.password)}
                      disabled={submitting}
                    />
                    {fieldErrors.password && <FieldError>{fieldErrors.password}</FieldError>}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="confirm-password"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Confirmar senha
                    </Label>
                    <PasswordInput
                      id="confirm-password"
                      autoComplete="new-password"
                      placeholder="Repita a senha"
                      required
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFieldError("confirmPassword");
                      }}
                      aria-invalid={Boolean(fieldErrors.confirmPassword)}
                      disabled={submitting}
                    />
                    {fieldErrors.confirmPassword && (
                      <FieldError>{fieldErrors.confirmPassword}</FieldError>
                    )}
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full rounded-lg" disabled={submitting}>
                  {submitting ? "Criando acesso..." : "Criar acesso"}
                </Button>
              </form>

            <p className="text-center text-sm text-muted-foreground">
              Já tenho acesso?{" "}
              <Link
                to="/auth/auth2/login"
                className="font-medium text-primary hover:underline"
              >
                Entrar
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BoxedRegister;
