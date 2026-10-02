import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

// Campo de senha com botão de mostrar/ocultar; começa sempre oculto e só troca o type do input.
export const PasswordInput = ({ disabled, ...props }: Omit<ComponentProps<"input">, "type">) => {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput type={visible ? "text" : "password"} disabled={disabled} {...props} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((prev) => !prev)}
          disabled={disabled}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};
