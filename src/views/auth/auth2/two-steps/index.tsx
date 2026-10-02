import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { verifyEmail } from "@/api/auth/auth-api";
import { FetchError } from "@/api/global-fetcher";
import { AuthShowcase, BrandMark } from "../auth-showcase";

const CODE_LENGTH = 6;
const INVALID_CODE = "Código inválido ou expirado";
const GENERIC_ERROR = "Não foi possível confirmar seu e-mail agora. Tente novamente em instantes.";

// 400 é problema do código (inválido/expirado ou fora do formato); o resto fica na mensagem genérica.
const toSubmitError = (err: unknown): { code?: string; form?: string } => {
  if (err instanceof FetchError && err.status === 400) {
    const body = err.body as { message?: string; errors?: Record<string, string> } | undefined;
    if (body?.errors?.code) return { code: `Código ${body.errors.code}.` };
    return { code: body?.message ?? INVALID_CODE };
  }
  return { form: GENERIC_ERROR };
};

// Confirmação do e-mail após o cadastro: o e-mail chega pelo state da navegação vinda do registro.
const BoxedTwoStep = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email;
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || submitting || code.length !== CODE_LENGTH) return;
    setCodeError(undefined);
    setError(undefined);
    setSubmitting(true);
    try {
      await verifyEmail({ email, code });
      // Nenhum token aqui: o acesso começa no login, agora liberado.
      navigate("/auth/auth2/login", { replace: true });
    } catch (err) {
      const { code: codeMessage, form } = toSubmitError(err);
      setCodeError(codeMessage);
      setError(form);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <AuthShowcase />

      {/* Email verification form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center">
            <BrandMark />
          </div>

          <Card className="w-full border-none shadow-lg p-6 sm:p-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-foreground">Confirme seu e-mail</h2>
              {email && (
                <p className="text-sm text-muted-foreground">
                  Enviamos um código de 6 dígitos para{" "}
                  <span className="font-medium text-foreground break-all">{email}</span>. Digite o
                  código abaixo para ativar seu acesso.
                </p>
              )}
            </div>

            {email ? (
              <form className="space-y-6 w-full" onSubmit={handleSubmit}>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1.5">
                  <InputOTP
                    maxLength={CODE_LENGTH}
                    pattern={REGEXP_ONLY_DIGITS}
                    id="otp"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(value) => {
                      setCode(value);
                      setCodeError(undefined);
                    }}
                    aria-invalid={Boolean(codeError)}
                    disabled={submitting}
                    autoFocus
                  >
                    <InputOTPGroup className="gap-1 *:data-[slot=input-otp-slot]:rounded-lg *:data-[slot=input-otp-slot]:flex-1 *:data-[slot=input-otp-slot]:size-9  w-full">
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  {codeError && <FieldError>{codeError}</FieldError>}
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-lg"
                  disabled={submitting || code.length !== CODE_LENGTH}
                >
                  {submitting ? "Verificando..." : "Verificar"}
                </Button>
              </form>
            ) : (
              // Acesso direto ou página recarregada: sem o e-mail do cadastro não há o que verificar.
              <Alert>
                <AlertDescription>
                  Não encontramos o e-mail do seu cadastro. Faça o cadastro novamente para receber um
                  novo código de confirmação.
                </AlertDescription>
              </Alert>
            )}

            <p className="text-center text-sm text-muted-foreground">
              {email ? "Já confirmou seu e-mail?" : "Precisa se cadastrar?"}{" "}
              <Link
                to={email ? "/auth/auth2/login" : "/auth/auth2/register"}
                className="font-medium text-primary hover:underline"
              >
                {email ? "Entrar" : "Criar seu acesso"}
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BoxedTwoStep;
