import type { FormEvent } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthShowcase, BrandMark } from "../auth-showcase";

const BoxedLogin = () => {
  // Visual-only form for now: no authentication is wired up yet.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="password"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Checkbox id="remember" className={"cursor-pointer"} />
                  <Label
                    htmlFor="remember"
                    className="text-muted-foreground font-normal cursor-pointer leading-0"
                  >
                    Lembrar dispositivo
                  </Label>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full rounded-lg">
                Entrar
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
          </Card>
        </div>
      </main>
    </div>
  );
};

export default BoxedLogin;
