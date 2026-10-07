import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { resendVerification, verifyEmail } from "@/api/auth/auth-api";
import { FetchError } from "@/api/global-fetcher";
import { AuthShowcase, BrandMark } from "../auth-showcase";

const CODE_LENGTH = 6;
const INVALID_CODE = "Código inválido ou expirado";
const GENERIC_ERROR = "Não foi possível confirmar seu e-mail agora. Tente novamente em instantes.";
const RESEND_SUCCESS = "Um novo código foi enviado para seu e-mail.";
const RESEND_ERROR = "Não foi possível reenviar o código agora. Tente novamente em instantes.";

// 400 é problema do código (inválido/expirado ou fora do formato); o resto fica na mensagem genérica.
const toSubmitError = (err: unknown): { code?: string; form?: string } => {
  if (err instanceof FetchError && err.status === 400) {
    const body = err.body as { message?: string; errors?: Record<string, string> } | undefined;
    if (body?.errors?.code) return { code: `Código ${body.errors.code}.` };
    return { code: body?.message ?? INVALID_CODE };
  }
  return { form: GENERIC_ERROR };
};

// No reenvio, 400 é problema do e-mail informado; o resto fica na mensagem genérica.
const toResendError = (err: unknown): string => {
  if (err instanceof FetchError && err.status === 400) {
    const body = err.body as { message?: string; errors?: Record<string, string> } | undefined;
    if (body?.errors?.email) return `E-mail ${body.errors.email}.`;
    if (body?.message) return body.message;
  }
  return RESEND_ERROR;
};

// Confirmação do e-mail: o e-mail chega pelo state da navegação (cadastro ou login);
// sem ele (acesso direto ou página recarregada), o usuário informa o e-mail na própria tela.
const BoxedTwoStep = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateEmail = (location.state as { email?: string } | null)?.email;
  const [typedEmail, setTypedEmail] = useState("");
  const email = stateEmail ?? typedEmail.trim();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (resending || submitting) return;
    setNotice(undefined);
    if (!email) {
      setError("Informe seu e-mail para receber um novo código.");
      return;
    }
    setError(undefined);
    setResending(true);
    try {
      await resendVerification(email);
      setNotice(RESEND_SUCCESS);
    } catch (err) {
      setError(toResendError(err));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || submitting || resending || code.length !== CODE_LENGTH) return;
    setCodeError(undefined);
    setError(undefined);
    setNotice(undefined);
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
              {stateEmail ? (
                <p className="text-sm text-muted-foreground">
                  Enviamos um código de 6 dígitos para{" "}
                  <span className="font-medium text-foreground break-all">{stateEmail}</span>. Digite o
                  código abaixo para ativar seu acesso.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Informe o e-mail do seu cadastro e o código de 6 dígitos que enviamos para ele.
                </p>
              )}
            </div>

            <form className="space-y-6 w-full" onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {notice && (
                <Alert>
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                {!stateEmail && (
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
                      value={typedEmail}
                      onChange={(e) => setTypedEmail(e.target.value)}
                      disabled={submitting || resending}
                      autoFocus
                    />
                  </div>
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
                    autoFocus={Boolean(stateEmail)}
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
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-lg"
                disabled={submitting || resending || code.length !== CODE_LENGTH}
              >
                {submitting ? "Verificando..." : "Verificar"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Não recebeu o código?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={submitting || resending}
                className="font-medium text-primary hover:underline cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resending ? "Reenviando..." : "Reenviar código"}
              </button>
            </p>

            <p className="text-center text-sm text-muted-foreground">
              Já confirmou seu e-mail?{" "}
              <Link to="/auth/auth2/login" className="font-medium text-primary hover:underline">
                Entrar
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BoxedTwoStep;
