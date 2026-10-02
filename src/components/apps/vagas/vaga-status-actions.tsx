import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FetchError } from "src/api/global-fetcher";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "src/components/ui/alert-dialog";
import { Button } from "src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "src/components/ui/dropdown-menu";
import { VagaStatus, VagaStatusAlteravel } from "src/types/apps/vagas";

type StatusAction = "SUSPENDER" | "RETOMAR" | "CANCELAR";

const ACTIONS: Record<
  StatusAction,
  {
    label: string;
    /** Status enviado ao backend */
    status: VagaStatusAlteravel;
    title: string;
    description: string;
    cancelLabel: string;
    destructive?: boolean;
  }
> = {
  SUSPENDER: {
    label: "Suspender processo",
    status: "PAUSADA",
    title: "Suspender processo?",
    description:
      "A vaga ficará pausada e não será possível cadastrar, avançar ou reprovar candidatos enquanto o processo estiver suspenso.",
    cancelLabel: "Cancelar",
  },
  RETOMAR: {
    label: "Retomar processo",
    status: "ATUANDO",
    title: "Retomar processo?",
    description:
      "A vaga voltará a ficar ativa e as movimentações de candidatos serão liberadas novamente.",
    cancelLabel: "Voltar",
  },
  CANCELAR: {
    label: "Cancelar processo",
    status: "CANCELADA",
    title: "Cancelar processo?",
    description: "O processo será encerrado e a vaga continuará disponível apenas para consulta.",
    cancelLabel: "Voltar",
    destructive: true,
  },
};

// Vagas canceladas ou fechadas não mudam mais de status.
const ACTIONS_BY_STATUS: Record<VagaStatus, StatusAction[]> = {
  ATUANDO: ["SUSPENDER", "CANCELAR"],
  PAUSADA: ["RETOMAR", "CANCELAR"],
  CANCELADA: [],
  FECHADA: [],
};

// 409 traz a regra que impediu a alteração; o resto é genérico.
const toStatusError = (err: unknown) => {
  if (err instanceof FetchError) {
    const message = (err.body as { message?: string } | undefined)?.message;
    if (err.status === 409 && message) return `${message}.`;
  }
  return "Não foi possível alterar o status da vaga. Tente novamente.";
};

interface VagaStatusActionsProps {
  /** Status atual, vindo do backend */
  status: VagaStatus;
  onChangeStatus: (status: VagaStatusAlteravel) => Promise<void>;
}

const VagaStatusActions = ({ status, onChangeStatus }: VagaStatusActionsProps) => {
  // A ação fica guardada depois de fechar para o texto não sumir durante a animação do diálogo.
  const [action, setAction] = useState<StatusAction>();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const available = ACTIONS_BY_STATUS[status];
  const current = action && ACTIONS[action];

  const handleSelect = (next: StatusAction) => {
    setAction(next);
    setError(undefined);
    setOpen(true);
  };

  const handleConfirm = async () => {
    if (!current || saving) return;
    setSaving(true);
    setError(undefined);
    try {
      await onChangeStatus(current.status);
      setOpen(false);
    } catch (err) {
      setError(toStatusError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {available.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button type="button" variant="ghost" size="xs" disabled={saving} />}
          >
            Alterar status
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            {available.map((item) => (
              <DropdownMenuItem
                key={item}
                variant={ACTIONS[item].destructive ? "destructive" : "default"}
                onClick={() => handleSelect(item)}
              >
                {ACTIONS[item].label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Durante a requisição o diálogo não fecha: evita um segundo envio. */}
      <AlertDialog open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{current?.title}</AlertDialogTitle>
            <AlertDialogDescription>{current?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>{current?.cancelLabel}</AlertDialogCancel>
            <Button
              type="button"
              variant={current?.destructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={saving}
            >
              {saving ? "Salvando..." : current?.label}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default VagaStatusActions;
