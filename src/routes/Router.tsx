// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import RequireAuth from './RequireAuth';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

const Error = Loadable(lazy(() => import('../views/auth/error')));

//apps
const MinhasVagas = Loadable(lazy(() => import('../views/apps/vagas')));
const NovaVaga = Loadable(lazy(() => import('../views/apps/vagas/create')));
const VagaDetail = Loadable(lazy(() => import('../views/apps/vagas/detail')));

// authentication

const Login2 = Loadable(lazy(() => import('../views/auth/auth2/login')));

const Register2 = Loadable(lazy(() => import('../views/auth/auth2/register')));

const TwoSteps2 = Loadable(lazy(() => import('../views/auth/auth2/two-steps')));

const Router = [
  {
    path: '/',
    // Telas da aplicação: exigem login. O BlankLayout abaixo (login, registro, erros) continua público.
    element: (
      <RequireAuth>
        <FullLayout />
      </RequireAuth>
    ),
    children: [
      // Minhas vagas é a tela principal do produto.
      { path: '/', element: <Navigate to="/apps/vagas" replace /> },

      { path: '/apps/vagas', element: <MinhasVagas /> },
      { path: '/apps/vagas/create', element: <NovaVaga /> },
      { path: '/apps/vagas/:id', element: <VagaDetail /> },

      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/auth2/login', element: <Login2 /> },

      { path: '/auth/auth2/register', element: <Register2 /> },

      { path: '/auth/auth2/two-steps', element: <TwoSteps2 /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;
