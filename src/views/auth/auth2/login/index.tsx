import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { LoginError, login, startSession } from "@/api/auth/auth-api";
import { AuthShowcase, BrandMark } from "../auth-showcase";
import { PasswordInput } from "../password-input";

const BoxedLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);
    try {
      const response = await login(email.trim(), password);
      // Guarda o JWT e o nome/e-mail do perfil; a senha fica apenas no estado do formulário, que é descartado na navegação.
      await startSession(response);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from && from !== "/" ? from : "/apps/vagas", { replace: true });
    } catch (err) {
      setError(err instanceof LoginError ? err.message : "Não foi possível entrar agora. Tente novamente em instantes.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <AuthShowcase />

      {/* Login form */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex justify-center">
            <BrandMark />
          </div>

          <Card className="w-full border-none shadow-lg p-6 sm:p-8">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-foreground">Entrar</h2>
              <p className="text-sm text-muted-foreground">
                Acesse seu painel de recrutamento.
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
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
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
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="remember" className={"cursor-pointer"} />
                    <Label
                      htmlFor="remember"
                      className="text-muted-foreground font-normal cursor-pointer leading-0"
                    >
                      Lembrar dispositivo
                    </Label>
                  </div>
                  <Link
                    to="/auth/auth2/forgot-password"
                    state={email.trim() ? { email: email.trim() } : undefined}
                    className="font-medium text-primary hover:underline"
                  >
                    Esqueci minha senha
                  </Link>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full rounded-lg" disabled={submitting}>
                {submitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Primeiro acesso?{" "}
              <Link
                to="/auth/auth2/register"
                className="font-medium text-primary hover:underline"
              >
                Criar seu acesso
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Não recebeu o código?{" "}
              <Link
                to="/auth/auth2/two-steps"
                // Mesmo mecanismo do cadastro: o e-mail já digitado segue pelo state da navegação.
                state={email.trim() ? { email: email.trim() } : undefined}
                className="font-medium text-primary hover:underline"
              >
                Reenviar código
              </Link>
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BoxedLogin;
