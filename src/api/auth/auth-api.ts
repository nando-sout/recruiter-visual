import { mutate } from "swr";
import { postFetcher } from "src/api/global-fetcher";
import { removeToken, saveToken, saveUser } from "src/lib/auth-token";

// Contrato de POST /auth/login no backend (LoginRequest / LoginResponse).
export interface LoginResponse {
  message: string;
  token: string;
  recruiterId: string;
  name: string;
  email: string;
}

export class LoginError extends Error {}

// 403 do login: a senha confere, mas o e-mail ainda não foi confirmado; a tela oferece o caminho para a verificação.
export class EmailNotVerifiedError extends LoginError {}

// Chama o backend direto, sem o global-fetcher: aqui um 401 é "senha errada",
// não "sessão expirada", e deve virar mensagem na tela em vez de redirecionar.
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  let res: Response;
  try {
    res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new LoginError("Não foi possível conectar ao servidor. Tente novamente em instantes.");
  }

  if (res.status === 401) {
    throw new LoginError("E-mail ou senha inválidos.");
  }
  if (res.status === 403) {
    throw new EmailNotVerifiedError(
      "Seu e-mail ainda não foi verificado. Solicite um novo código para continuar.",
    );
  }
  if (res.status === 400) {
    throw new LoginError("Informe um e-mail válido e a senha.");
  }
  if (!res.ok) {
    throw new LoginError("Não foi possível entrar agora. Tente novamente em instantes.");
  }
  return res.json();
};

// O cache do SWR é global e as chaves não dependem do usuário (ex.: /api/vagas):
// sem limpar, a tela mostraria os dados do recruiter anterior até a nova resposta chegar.
const clearCache = () => mutate(() => true, undefined, { revalidate: false });

// Depois de um login bem-sucedido: descarta o cache da sessão anterior e guarda o token e os dados do perfil.
export const startSession = async ({ token, name, email }: LoginResponse) => {
  await clearCache();
  saveToken(token);
  saveUser({ name, email });
};

// Logout: sem o token, o RequireAuth volta a exigir login em qualquer tela protegida.
export const endSession = async () => {
  removeToken();
  await clearCache();
};

// Contrato de POST /auth/register no backend (RegisterRequest / RegisterResponse).
// Sem token: o recruiter só consegue entrar depois de confirmar o e-mail.
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  recruiterId: string;
  name: string;
  email: string;
}

// Rota pública: passa pelo global-fetcher; erros chegam como FetchError com status e corpo
// (400 { message, errors }, 409 { message }).
export const register = (data: RegisterRequest): Promise<RegisterResponse> =>
  postFetcher("/api/auth/register", data);

// Contrato de POST /auth/verify-email no backend (VerifyEmailRequest / MessageResponse).
export interface VerifyEmailRequest {
  email: string;
  code: string;
}

// Rota pública: 400 chega como FetchError com { message } (código inválido/expirado)
// ou { message, errors } (validação).
export const verifyEmail = (data: VerifyEmailRequest): Promise<{ message: string }> =>
  postFetcher("/api/auth/verify-email", data);

// POST /auth/resend-verification no backend: envia um novo código para quem ainda não confirmou o e-mail.
// Rota pública: erros chegam como FetchError com status e corpo, como nas chamadas acima.
export const resendVerification = (email: string): Promise<{ message: string }> =>
  postFetcher("/api/auth/resend-verification", { email });

// POST /auth/forgot-password no backend: envia um código de redefinição de senha para o e-mail.
// Rota pública; a mensagem de resposta é neutra (não revela se o e-mail tem cadastro).
export const forgotPassword = (email: string): Promise<{ message: string }> =>
  postFetcher("/api/auth/forgot-password", { email });

// POST /auth/reset-password no backend: troca a senha usando o código recebido por e-mail.
// Rota pública: 400 chega como FetchError com { message } (código inválido/expirado)
// ou { message, errors } (validação).
export const resetPassword = (
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> =>
  postFetcher("/api/auth/reset-password", { email, code, newPassword });
