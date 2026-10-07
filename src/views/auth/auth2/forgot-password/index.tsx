import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { forgotPassword } from "@/api/auth/auth-api";
import { FetchError } from "@/api/global-fetcher";
import { AuthShowcase, BrandMark } from "../auth-showcase";

const GENERIC_ERROR = "Não foi possível enviar o código agora. Tente novamente em instantes.";

// 400 é problema do e-mail informado; o resto fica na mensagem genérica.
const toSubmitError = (err: unknown): { email?: string; form?: string } => {
  if (err instanceof FetchError && err.status === 400) {
    const body = err.body as { message?: string; errors?: Record<string, string> } | undefined;
    if (body?.errors?.email) return { email: `E-mail ${body.errors.email}.` };
    if (body?.message) return { email: body.message };
  }
  return { form: GENERIC_ERROR };
};

// Início da redefinição de senha: o e-mail pode vir preenchido pelo state da navegação vinda do login.
const BoxedForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email ?? "");
  const [emailError, setEmailError] = useState<string>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setEmailError(undefined);
    setError(undefined);
    setSubmitting(true);
    try {
      const response = await forgotPassword(email.trim());
      // A resposta é neutra (não revela se o e-mail tem cadastro) e aparece na tela seguinte.
      navigate("/auth/auth2/reset-password", {
        state: { email: email.trim(), message: response.message },
      });
    } catch (err) {
      const { email: emailMessage, form } = toSubmitError(err);
      setEmailError(emailMessage);
      setError(form);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <AuthShowcase />

      {/* Forgot password form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center">
            <BrandMark />
          </div>

          <Card className="w-full border-none shadow-lg p-6 sm:p-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-foreground">Esqueci minha senha</h2>
              <p className="text-sm text-muted-foreground">
                Informe seu e-mail e enviaremos um código para redefinir sua senha.
              </p>
            </div>

            <form className="space-y-6 w-full" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-normal text-muted-foreground">
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
                    setEmailError(undefined);
                  }}
                  aria-invalid={Boolean(emailError)}
                  disabled={submitting}
                  autoFocus
                />
                {emailError && <FieldError>{emailError}</FieldError>}
              </div>
              <Button type="submit" size="lg" className="w-full rounded-lg" disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar código"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/auth/auth2/login" className="font-medium text-primary hover:underline">
                Voltar para o login
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BoxedForgotPassword;
