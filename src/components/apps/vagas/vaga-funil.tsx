import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "src/components/ui/chart";
import { CandidatoResponse, EtapaType } from "src/types/apps/vagas";

const ativosConfig = {
  candidatos: { label: "Candidatos", color: "var(--color-primary)" },
} satisfies ChartConfig;

const reprovadosConfig = {
  reprovados: { label: "Reprovados", color: "var(--color-destructive)" },
} satisfies ChartConfig;

const BAR_ROW_HEIGHT = 40;

// Candidatos ativos (não reprovados) por etapa atual, na ordem configurada da vaga.
export const countAtivosPorEtapa = (etapas: EtapaType[], candidatos: CandidatoResponse[]) =>
  etapas.map((etapa) => ({
    etapa: etapa.name,
    candidatos: candidatos.filter((c) => !c.reprovado && c.etapaId === etapa.id).length,
  }));

// Uma barra por etapa, na ordem recebida. `dataKey` é a série do config e o campo numérico de cada linha;
// cada funil tem a própria escala.
const FunilChart = ({
  data,
  dataKey,
  config,
}: {
  data: Array<{ etapa: string } & Record<string, string | number>>;
  dataKey: string;
  config: ChartConfig;
}) => (
  <ChartContainer
    config={config}
    className="aspect-auto w-full"
    style={{ height: data.length * BAR_ROW_HEIGHT + 16 }}
  >
    <BarChart data={data} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}>
      <XAxis type="number" dataKey={dataKey} allowDecimals={false} hide />
      <YAxis
        type="category"
        dataKey="etapa"
        width={160}
        tickLine={false}
        axisLine={false}
        tickMargin={8}
      />
      <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent />} />
      <Bar
        dataKey={dataKey}
        fill={`var(--color-${dataKey})`}
        radius={[0, 4, 4, 0]}
        barSize={20}
        minPointSize={2}
      >
        <LabelList
          dataKey={dataKey}
          position="right"
          className="fill-foreground text-xs tabular-nums"
        />
      </Bar>
    </BarChart>
  </ChartContainer>
);

interface VagaFunilProps {
  /** Etapas já ordenadas por `order` */
  etapas: EtapaType[];
  candidatos: CandidatoResponse[];
}

const VagaFunil = ({ etapas, candidatos }: VagaFunilProps) => (
  <FunilChart
    data={countAtivosPorEtapa(etapas, candidatos)}
    dataKey="candidatos"
    config={ativosConfig}
  />
);

// Reprovados por etapa da reprovação: usa só o `reprovadosCount` que o backend devolve em cada etapa.
export const VagaFunilReprovados = ({ etapas }: Pick<VagaFunilProps, "etapas">) => (
  <FunilChart
    data={etapas.map((etapa) => ({ etapa: etapa.name, reprovados: etapa.reprovadosCount }))}
    dataKey="reprovados"
    config={reprovadosConfig}
  />
);

// Só formata o valor do backend: null (ninguém chegou à etapa) ou ausente vira "—", nunca 0%.
const formatTaxaReprovacao = (taxa: number | null | undefined) =>
  taxa == null
    ? "—"
    : `${taxa.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

// Taxa de reprovação por etapa, na ordem do funil: exibe o `taxaReprovacao` que o backend devolve, sem recalcular.
export const VagaTaxaReprovacao = ({ etapas }: Pick<VagaFunilProps, "etapas">) => (
  <div className="flex flex-col gap-2">
    <h4 className="text-sm font-medium">Taxa de reprovação</h4>
    <ul className="flex flex-col gap-1">
      {etapas.map((etapa) => (
        <li key={etapa.id} className="flex items-center justify-between gap-4 text-sm">
          <span className="min-w-0 truncate text-muted-foreground">{etapa.name}</span>
          <span className="shrink-0 tabular-nums">{formatTaxaReprovacao(etapa.taxaReprovacao)}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default VagaFunil;
