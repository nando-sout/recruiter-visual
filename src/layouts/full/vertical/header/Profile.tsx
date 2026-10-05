

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetFooter,
  SheetClose,
} from "src/components/ui/sheet";
import { Avatar, AvatarFallback } from "src/components/ui/avatar";
import { Button } from "src/components/ui/button";
import { Icon } from "@iconify/react";

import { cn } from "src/lib/utils";
import { Mailbox } from 'lucide-react';

import { profileDD } from "./data";
import { Link, useNavigate } from "react-router";
import { endSession } from "src/api/auth/auth-api";
import { LOGIN_PATH, getUser } from "src/lib/auth-token";
export default function ProfileSheet() {
  const navigate = useNavigate();
  // Nome e e-mail vêm do LoginResponse, guardados no login junto com o token.
  const user = getUser();
  const name = user?.name || "Recruiter";
  // O avatar é a primeira letra do nome do recruiter logado.
  const initial = name.trim().charAt(0).toUpperCase();

  // replace: o botão voltar não retorna à tela protegida, e o RequireAuth barra qualquer URL direta sem token.
  const handleLogout = async () => {
    await endSession();
    navigate(LOGIN_PATH, { replace: true });
  };

  return (
    <Sheet>
      {/* Trigger Button */}
      <SheetTrigger className="cursor-pointer hover:bg-primary/5 flex items-center justify-center rounded-full h-10 w-10">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {initial}
          </AvatarFallback>
        </Avatar>
      </SheetTrigger>

      {/* Drawer Panel */}
      <SheetContent
        showCloseButton={false}
        side="right"
        className="border-s-0 w-full sm:max-w-80 max-w-60"
      >
        <SheetClose className="absolute top-5 end-5 p-2 hover:bg-primary/5 hover:text-primary rounded-full">
          <Icon icon="tabler:x" width={20} height={20} />
        </SheetClose>
        {/* Top Profile Section */}
        <div className="p-6 py-6">
          <div className="flex flex-col gap-4 justify-center items-center pt-10">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <h6 className="text-lg font-semibold">{name}</h6>
              {user?.email && (
                <div className="flex items-center gap-2 justify-center">
                  <Mailbox
                    size={18} className="text-muted-foreground"
                  />
                  <span className="text-sm font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu List */}
        <div className="border-t  border-border">
          <ul className="flex flex-col gap-2 p-6">
            {profileDD.map((item) => (
              <li key={item.title} className="group">
                <Link
                  to={item.href}
                  className={cn(
                    "flex gap-3 py-2 px-3 rounded-md group-hover:bg-primary/5 text-muted-foreground"
                  )}
                >
                  <item.avatar
                    width={20}
                    height={20}
                    className="group-hover:text-primary"
                  />

                  <div className="flex gap-3 items-center">
                    <h6 className="text-sm group-hover:text-primary">
                      {item.title}
                    </h6>

                    {item.badge && (
                      <span className="h-5 w-6 text-sm flex justify-center items-center text-primary rounded-sm bg-primary/5">
                        4
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <SheetFooter className="px-0 pb-6">
          <div className="border-t border-border w-full">
            <div className="rounded-sm pt-6 flex flex-col justify-center items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleLogout}
                className="text-primary"
              >
                Sair
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
