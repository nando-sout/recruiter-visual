import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { forgotPassword, resetPassword } from "@/api/auth/auth-api";
import { FetchError } from "@/api/global-fetcher";
import { AuthShowcase, BrandMark } from "../auth-showcase";
import { PasswordInput } from "../password-input";

type FieldName = "email" | "code" | "newPassword" | "confirmPassword";
type FieldErrors = Partial<Record<FieldName, string>>;

// O backend devolve só o complemento da mensagem ("é obrigatório"); o rótulo do campo vem daqui.
const FIELD_LABELS: Record<Exclude<FieldName, "confirmPassword">, string> = {
  email: "E-mail",
  code: "Código",
  newPassword: "Nova senha",
};

const CODE_LENGTH = 6;
const INVALID_CODE = "Código inválido ou expirado";
const GENERIC_ERROR = "Não foi possível redefinir sua senha agora. Tente novamente em instantes.";
const RESEND_SUCCESS = "Um novo código foi enviado para seu e-mail.";
const RESEND_ERROR = "Não foi possível enviar o código agora. Tente novamente em instantes.";

// 400 { message, errors } do POST /auth/reset-password vira erros por campo, como no cadastro;
// 400 só com { message } é problema do código (inválido/expirado); o resto fica na mensagem genérica.
const toSubmitErrors = (err: unknown): { fields: FieldErrors; form?: string } => {
  if (!(err instanceof FetchError) || err.status !== 400) return { fields: {}, form: GENERIC_ERROR };
  const body = err.body as { message?: string; errors?: Record<string, string> } | undefined;

  if (body?.errors) {
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
  return { fields: { code: body?.message ?? INVALID_CODE } };
};

// No reenvio, 400 é problema do e-mail informado; o resto fica na mensagem genérica.
const toResendErrors = (err: unknown): { fields: FieldErrors; form?: string } => {
  if (err instanceof FetchError && err.status === 400) {
    const body = err.body as { message?: string; errors?: Record<string, string> } | undefined;
    if (body?.errors?.email) return { fields: { email: `E-mail ${body.errors.email}.` } };
    if (body?.message) return { fields: { email: body.message } };
  }
  return { fields: {}, form: RESEND_ERROR };
};

// Redefinição de senha: o e-mail e a mensagem do envio chegam pelo state da navegação vinda de
// "Esqueci minha senha"; sem eles (acesso direto ou página recarregada), o usuário informa o e-mail aqui.
// E-mail, código e senha ficam apenas no estado do formulário.
const BoxedResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { email?: string; message?: string } | null;
  const [email, setEmail] = useState(state?.email ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState(state?.message);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [done, setDone] = useState(false);

  const clearFieldError = (field: FieldName) =>
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleResend = async () => {
    if (resending || submitting) return;
    setNotice(undefined);
    setError(undefined);
    if (!email.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: "Informe seu e-mail para receber um novo código." }));
      return;
    }
    clearFieldError("email");
    setResending(true);
    try {
      const response = await forgotPassword(email.trim());
      // Inclui a resposta do backend durante o cooldown de reenvio.
      setNotice(response?.message ?? RESEND_SUCCESS);
    } catch (err) {
      const { fields, form } = toResendErrors(err);
      setFieldErrors((prev) => ({ ...prev, ...fields }));
      setError(form);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting || resending || code.length !== CODE_LENGTH) return;
    setError(undefined);
    setNotice(undefined);

    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "As senhas não coincidem." });
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      // confirmPassword fica só no formulário; nenhum token é criado: o acesso começa no login.
      await resetPassword(email.trim(), code, newPassword);
      setDone(true);
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

      {/* Reset password form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center">
            <BrandMark />
          </div>

          {done ? (
            <Card className="w-full border-none shadow-lg p-6 sm:p-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-foreground">Senha alterada com sucesso</h2>
                <p className="text-sm text-muted-foreground">
                  Sua senha foi redefinida. Agora você pode entrar com sua nova senha.
                </p>
              </div>
              <Button
                type="button"
                size="lg"
                className="w-full rounded-lg"
                onClick={() => navigate("/auth/auth2/login", { replace: true })}
              >
                Voltar para o login
              </Button>
            </Card>
          ) : (
            <Card className="w-full border-none shadow-lg p-6 sm:p-8">
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-foreground">Redefinir senha</h2>
                <p className="text-sm text-muted-foreground">
                  Digite o código de 6 dígitos enviado para seu e-mail e escolha uma nova senha.
                </p>
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
                        clearFieldError("email");
                      }}
                      aria-invalid={Boolean(fieldErrors.email)}
                      disabled={submitting || resending}
                      autoFocus={!state?.email}
                    />
                    {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="otp" className="text-sm font-normal text-muted-foreground">
                      Código
                    </Label>
                    <InputOTP
                      maxLength={CODE_LENGTH}
                      pattern={REGEXP_ONLY_DIGITS}
                      id="otp"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(value) => {
                        setCode(value);
                        clearFieldError("code");
                      }}
                      aria-invalid={Boolean(fieldErrors.code)}
                      disabled={submitting}
                      autoFocus={Boolean(state?.email)}
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
                    {fieldErrors.code && <FieldError>{fieldErrors.code}</FieldError>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-password" className="text-sm font-normal text-muted-foreground">
                      Nova senha
                    </Label>
                    <PasswordInput
                      id="new-password"
                      autoComplete="new-password"
                      placeholder="Crie uma nova senha"
                      required
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        clearFieldError("newPassword");
                      }}
                      aria-invalid={Boolean(fieldErrors.newPassword)}
                      disabled={submitting}
                    />
                    {fieldErrors.newPassword && <FieldError>{fieldErrors.newPassword}</FieldError>}
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="confirm-password"
                      className="text-sm font-normal text-muted-foreground"
                    >
                      Confirmar nova senha
                    </Label>
                    <PasswordInput
                      id="confirm-password"
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
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
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-lg"
                  disabled={submitting || resending || code.length !== CODE_LENGTH}
                >
                  {submitting ? "Redefinindo..." : "Redefinir senha"}
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
                  {resending ? "Enviando..." : "Enviar novamente"}
                </button>
              </p>

              <p className="text-center text-sm text-muted-foreground">
                <Link to="/auth/auth2/login" className="font-medium text-primary hover:underline">
                  Voltar para o login
                </Link>
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default BoxedResetPassword;
