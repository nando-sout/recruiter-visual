import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { LOGIN_PATH, getToken } from 'src/lib/auth-token';

// Sem JWT, qualquer tela da aplicação leva ao login, que devolve o usuário para onde ele ia.
// A validade do token é conferida pelo backend: um 401 descarta o token (ver global-fetcher).
const RequireAuth = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  if (!getToken()) {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
};

export default RequireAuth;
