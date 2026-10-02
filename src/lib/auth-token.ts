// Sessão do recruiter autenticado: o JWT e, para o perfil, o nome e o e-mail devolvidos no login. Nada de senha.
const TOKEN_KEY = "recruiter-visual.token";
const USER_KEY = "recruiter-visual.user";

export interface SessionUser {
  name: string;
  email: string;
}

// O acesso ao localStorage pode falhar (modo privado, armazenamento bloqueado); sem token, o usuário volta ao login.
export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Sem armazenamento, o login vale só até a próxima verificação de rota.
  }
};

// Remove o token e os dados do usuário: sem token não há sessão, e o perfil não deve mostrar o recruiter anterior.
export const removeToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // Nada a remover.
  }
};

export const saveUser = ({ name, email }: SessionUser) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify({ name, email }));
  } catch {
    // Sem armazenamento, o perfil fica sem nome e e-mail.
  }
};

export const getUser = (): SessionUser | null => {
  try {
    const user = JSON.parse(localStorage.getItem(USER_KEY) ?? "null");
    return typeof user?.name === "string" && typeof user?.email === "string" ? user : null;
  } catch {
    return null;
  }
};

export const LOGIN_PATH = "/auth/auth2/login";
