import type { LucideIcon } from "lucide-react";
import { History, KanbanSquare, ShieldCheck, UsersRound } from "lucide-react";

interface Highlight {
  icon: LucideIcon;
  title: string;
  description: string;
}

const highlights: Highlight[] = [
  {
    icon: KanbanSquare,
    title: "Pipeline por etapa",
    description: "Veja cada candidato na etapa em que ele está.",
  },
  {
    icon: History,
    title: "Histórico do candidato",
    description: "Consulte a trajetória completa em um só lugar.",
  },
  {
    icon: ShieldCheck,
    title: "Decisões rastreáveis",
    description: "Saiba quem decidiu o quê, e quando.",
  },
];

export const BrandMark = () => (
  <div className="flex items-center gap-3">
    <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <UsersRound className="size-5" />
    </span>
    <span className="text-xl font-semibold text-foreground">
      Recruiter Visual
    </span>
  </div>
);

export const AuthShowcase = () => (
  <aside className="hidden lg:flex flex-col justify-between bg-muted p-12 xl:p-16">
    <BrandMark />

    <div className="max-w-md space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-foreground">
          Governança visual de candidatos
        </h1>
        <p className="text-base text-muted-foreground">
          O Recruiter Visual ajuda recruiters a acompanhar visualmente seus
          candidatos em cada etapa do processo seletivo.
        </p>
      </div>

      <ul className="space-y-5">
        {highlights.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex items-start gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Icon className="size-4" />
            </span>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>

    <p className="text-xs text-muted-foreground">
      Recruiter Visual · Plataforma de governança de candidatos
    </p>
  </aside>
);
