import { Badge } from "src/components/ui/badge";
import { cn } from "src/lib/utils";
import { VAGA_STATUS_LABEL } from "src/lib/vagas";
import { VagaStatus } from "src/types/apps/vagas";

const statusClassName: Record<VagaStatus, string> = {
  ATUANDO: "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  PAUSADA: "bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  FECHADA: "bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-400",
  CANCELADA: "bg-destructive/10 text-destructive dark:bg-destructive/20",
};

const VagaStatusBadge = ({ status, className }: { status: VagaStatus; className?: string }) => (
  <Badge className={cn(statusClassName[status], className)}>
    <span aria-hidden className="size-1.5 rounded-full bg-current" />
    {VAGA_STATUS_LABEL[status]}
  </Badge>
);

export default VagaStatusBadge;
