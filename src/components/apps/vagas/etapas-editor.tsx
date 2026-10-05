import { KeyboardEvent, useState } from "react";
import { ArrowDown, ArrowUp, Flag, Plus, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "src/components/ui/alert-dialog";
import { Badge } from "src/components/ui/badge";
import { Button } from "src/components/ui/button";
import { FieldDescription, FieldError } from "src/components/ui/field";
import { Input } from "src/components/ui/input";
import { createEtapa, isEtapaFechamento, withExplicitOrder } from "src/lib/vagas";
import { EtapaType } from "src/types/apps/vagas";

interface EtapasEditorProps {
  /** Etapas já ordenadas por `order` */
  etapas: EtapaType[];
  onChange: (etapas: EtapaType[]) => void;
  error?: string;
  disabled?: boolean;
}

const EtapasEditor = ({
  etapas,
  onChange,
  error,
  disabled = false,
}: EtapasEditorProps) => {
  const [newEtapaName, setNewEtapaName] = useState("");
  // A etapa selecionada é mantida enquanto o diálogo fecha, para o conteúdo não trocar na animação.
  const [etapaToDelete, setEtapaToDelete] = useState<EtapaType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const openDeleteDialog = (etapa: EtapaType) => {
    setEtapaToDelete(etapa);
    setDeleteDialogOpen(true);
  };

  const renameEtapa = (id: string, name: string) =>
    onChange(etapas.map((etapa) => (etapa.id === id ? { ...etapa, name } : etapa)));

  // O backend exige o fechamento na última posição: ele não se move e nenhuma etapa troca de lugar com ele.
  const canMove = (index: number, direction: -1 | 1) => {
    const target = etapas[index + direction];
    return Boolean(target) && !isEtapaFechamento(etapas[index]) && !isEtapaFechamento(target);
  };

  const moveEtapa = (index: number, direction: -1 | 1) => {
    if (!canMove(index, direction)) return;
    const next = [...etapas];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    onChange(withExplicitOrder(next));
  };

  // A nova etapa entra antes do fechamento, que continua por último.
  const addEtapa = () => {
    const name = newEtapaName.trim();
    if (!name) return;
    const fechamentoIndex = etapas.findIndex(isEtapaFechamento);
    const position = fechamentoIndex === -1 ? etapas.length : fechamentoIndex;
    onChange(
      withExplicitOrder([
        ...etapas.slice(0, position),
        createEtapa(name, position + 1),
        ...etapas.slice(position),
      ]),
    );
    setNewEtapaName("");
  };

  // Enter no campo adiciona a etapa em vez de enviar o formulário da vaga.
  const handleNewEtapaKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEtapa();
    }
  };

  const confirmDelete = () => {
    if (!etapaToDelete) return;
    onChange(withExplicitOrder(etapas.filter((etapa) => etapa.id !== etapaToDelete.id)));
    setDeleteDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-2">
        {etapas.map((etapa, index) => {
          const fechamento = isEtapaFechamento(etapa);
          return (
            <li
              key={etapa.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-2 sm:flex-nowrap"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold tabular-nums">
                {etapa.order}
              </span>
              <Input
                aria-label={`Nome da etapa ${etapa.order}`}
                value={etapa.name}
                onChange={(e) => renameEtapa(etapa.id, e.target.value)}
                aria-invalid={Boolean(error) && !etapa.name.trim()}
                disabled={disabled}
                className="min-w-0 flex-1 basis-40"
              />
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {fechamento && (
                  <Badge variant="outline">
                    <Flag />
                    Fechamento
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    fechamento
                      ? "A etapa de fechamento fica sempre por último"
                      : `Mover "${etapa.name}" para cima`
                  }
                  disabled={disabled || !canMove(index, -1)}
                  onClick={() => moveEtapa(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    fechamento
                      ? "A etapa de fechamento fica sempre por último"
                      : `Mover "${etapa.name}" para baixo`
                  }
                  disabled={disabled || !canMove(index, 1)}
                  onClick={() => moveEtapa(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={
                    fechamento
                      ? "A etapa de fechamento não pode ser excluída"
                      : `Excluir "${etapa.name}"`
                  }
                  disabled={disabled || fechamento}
                  onClick={() => openDeleteDialog(etapa)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          aria-label="Nome da nova etapa"
          placeholder="Nome da nova etapa"
          value={newEtapaName}
          onChange={(e) => setNewEtapaName(e.target.value)}
          onKeyDown={handleNewEtapaKeyDown}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          onClick={addEtapa}
          disabled={disabled || !newEtapaName.trim()}
          className="sm:w-auto"
        >
          <Plus />
          Adicionar etapa
        </Button>
      </div>

      <FieldDescription>
        A ordem das etapas define o funil e o Kanban da vaga. A etapa de fechamento pode ser
        renomeada, mas fica sempre por último e não pode ser excluída.
      </FieldDescription>
      {error && <FieldError>{error}</FieldError>}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir etapa?</AlertDialogTitle>
            <AlertDialogDescription>
              A etapa "{etapaToDelete?.name}" será removida da vaga e as demais serão renumeradas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Excluir etapa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EtapasEditor;
