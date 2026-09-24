import { http, HttpResponse } from "msw";
import { v4 as uuidv4 } from "uuid";
import { NovaVagaInput, UpdateEtapasInput, VagaType } from "src/types/apps/vagas";
import {
  createDefaultEtapas,
  sortEtapas,
  validateEtapas,
  validateNovaVaga,
  withExplicitOrder,
} from "src/lib/vagas";

// Enquanto não há autenticação real, todas as vagas pertencem a este recruiter.
const MOCK_RECRUITER_ID = "recruiter-mock";

// Etapas padrão com uma distribuição fictícia de candidatos, apenas para a interface.
const mockEtapas = (candidatesPerEtapa: number[]) =>
  createDefaultEtapas().map((etapa, index) => ({
    ...etapa,
    candidatesCount: candidatesPerEtapa[index] ?? 0,
  }));

let VagasData: VagaType[] = [
  {
    id: uuidv4(),
    code: "VAGA-001",
    recruiterId: MOCK_RECRUITER_ID,
    title: "Desenvolvedor(a) Front-end Sênior",
    description:
      "Atuação no time de produto construindo interfaces em React e TypeScript com foco em performance e acessibilidade.",
    status: "ATUANDO",
    etapas: mockEtapas([18, 12, 8, 4]),
    createdAt: "2026-08-04T12:00:00",
  },
  {
    id: uuidv4(),
    code: "VAGA-002",
    recruiterId: MOCK_RECRUITER_ID,
    title: "Analista de Dados Pleno",
    description:
      "Construção de dashboards e análises para apoiar decisões das áreas comercial e financeira.",
    status: "ATUANDO",
    etapas: mockEtapas([15, 7, 5, 0]),
    createdAt: "2026-08-12T12:00:00",
  },
  {
    id: uuidv4(),
    code: "VAGA-003",
    recruiterId: MOCK_RECRUITER_ID,
    title: "Product Designer",
    description:
      "Responsável por pesquisa, prototipação e evolução do design system da plataforma.",
    status: "PAUSADA",
    etapas: mockEtapas([10, 6, 2, 0]),
    createdAt: "2026-08-20T12:00:00",
  },
  {
    id: uuidv4(),
    code: "VAGA-004",
    recruiterId: MOCK_RECRUITER_ID,
    title: "Engenheiro(a) de Back-end Java",
    description:
      "Desenvolvimento de microsserviços e integrações em ambiente cloud com foco em escalabilidade.",
    status: "FECHADA",
    etapas: mockEtapas([20, 9, 5, 1]),
    createdAt: "2026-09-01T12:00:00",
  },
  {
    id: uuidv4(),
    code: "VAGA-005",
    recruiterId: MOCK_RECRUITER_ID,
    title: "Analista de QA",
    description:
      "Planejamento e execução de testes manuais e automatizados para as aplicações web e mobile.",
    status: "CANCELADA",
    etapas: mockEtapas([8, 4, 0, 0]),
    createdAt: "2026-09-09T12:00:00",
  },
  {
    id: uuidv4(),
    code: "VAGA-006",
    recruiterId: MOCK_RECRUITER_ID,
    title: "Tech Recruiter",
    description:
      "Condução de processos seletivos para posições de tecnologia em parceria com os gestores das áreas.",
    status: "ATUANDO",
    etapas: mockEtapas([9, 0, 0, 0]),
    createdAt: "2026-09-17T12:00:00",
  },
];

const recruiterVagas = () => VagasData.filter((vaga) => vaga.recruiterId === MOCK_RECRUITER_ID);

const errorResponse = (status: number, msg: string) =>
  HttpResponse.json({ status, msg }, { status });

export const VagasHandlers = [
  // Mock GET endpoint: vagas do recruiter atual
  http.get("/api/data/vagas", () =>
    HttpResponse.json({ status: 200, msg: "Success", data: recruiterVagas() }),
  ),

  // Mock POST endpoint: cria a vaga com status inicial ATUANDO
  http.post("/api/data/vagas/add", async ({ request }) => {
    const input = (await request.json()) as NovaVagaInput;
    const errors = validateNovaVaga(
      input,
      VagasData.map((vaga) => vaga.code),
    );
    const firstError = Object.values(errors)[0];
    if (firstError) {
      return errorResponse(400, firstError);
    }

    VagasData.push({
      id: uuidv4(),
      code: input.code.trim(),
      recruiterId: MOCK_RECRUITER_ID,
      title: input.title.trim(),
      description: input.description.trim(),
      status: "ATUANDO",
      etapas: withExplicitOrder(sortEtapas(input.etapas)).map((etapa) => ({
        ...etapa,
        name: etapa.name.trim(),
        candidatesCount: 0,
      })),
      createdAt: new Date().toISOString(),
    });
    return HttpResponse.json({ status: 200, msg: "Success", data: recruiterVagas() });
  }),

  // Mock PUT endpoint: substitui a configuração de etapas de uma vaga
  http.put("/api/data/vagas/etapas", async ({ request }) => {
    const { id, etapas } = (await request.json()) as UpdateEtapasInput;
    const vaga = VagasData.find((item) => item.id === id);
    if (!vaga) {
      return errorResponse(404, "Vaga não encontrada.");
    }

    // Tipo e candidatos vêm do que já está salvo: o cliente só altera nome e ordem.
    const savedEtapas = new Map(vaga.etapas.map((etapa) => [etapa.id, etapa]));
    const nextEtapas = withExplicitOrder(sortEtapas(etapas)).map((etapa) => ({
      ...etapa,
      name: etapa.name.trim(),
      type: savedEtapas.get(etapa.id)?.type ?? "PADRAO",
      candidatesCount: savedEtapas.get(etapa.id)?.candidatesCount ?? 0,
    }));

    const etapasError = validateEtapas(nextEtapas);
    if (etapasError) {
      return errorResponse(400, etapasError);
    }

    // Candidatos ainda não podem ser movidos, então etapas com candidatos não podem sumir.
    const keptIds = new Set(nextEtapas.map((etapa) => etapa.id));
    if (vaga.etapas.some((etapa) => etapa.candidatesCount > 0 && !keptIds.has(etapa.id))) {
      return errorResponse(409, "Não é possível excluir etapas que possuem candidatos.");
    }

    VagasData = VagasData.map((item) => (item.id === id ? { ...item, etapas: nextEtapas } : item));
    return HttpResponse.json({ status: 200, msg: "Success", data: recruiterVagas() });
  }),
];
