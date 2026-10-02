import { LOGIN_PATH, getToken, removeToken } from 'src/lib/auth-token';

// Erro de resposta HTTP, com o status para a tela diferenciar casos como 409 (conflito)
// e o corpo JSON da resposta, quando houver (ex.: erros de validação por campo).
export class FetchError extends Error {
  readonly status: number;
  readonly body?: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Envia o JWT, quando existir, em todas as chamadas. Um 401 significa token ausente, inválido ou expirado:
// o token é descartado e o usuário volta para o login. O login não passa por aqui (ver src/api/auth).
const request = async (url: string | Request | URL, init: RequestInit, errorMessage: string) => {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    removeToken();
    window.location.replace(LOGIN_PATH);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new FetchError(errorMessage, res.status, body);
  }
  return res.json();
};

const jsonInit = (method: string, arg: any): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(arg),
});

// SWR fetcher function

const getFetcher = (url: string | Request | URL) =>
  request(url, {}, 'Failed to fetch the data');

const postFetcher = (url: string, arg: any) =>
  request(url, jsonInit('POST', arg), 'Failed to post data');

const putFetcher = (url: string, arg: any) =>
  request(url, jsonInit('PUT', arg), 'Failed to updated data');

const patchFetcher = (url: string, arg: any) =>
  request(url, jsonInit('PATCH', arg), 'Failed to updated data');

const deleteFetcher = (url: string, arg: any) =>
  request(url, jsonInit('DELETE', arg), 'Failed to delete data');

export { getFetcher, postFetcher, putFetcher, deleteFetcher, patchFetcher };
