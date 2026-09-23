import type { FormEvent } from "react";
import { Link } from "react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthShowcase, BrandMark } from "../auth-showcase";

const BoxedRegister = () => {
  // Visual-only form for now: no account is created or persisted.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
                  />
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
                    autoComplete="new-password"
                    placeholder="Crie uma senha"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="confirm-password"
                    className="text-sm font-normal text-muted-foreground"
                  >
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repita a senha"
                    required
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full rounded-lg">
                Criar acesso
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
