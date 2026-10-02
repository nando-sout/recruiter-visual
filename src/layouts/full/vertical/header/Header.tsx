


import { Link } from "react-router";
import { Button } from "src/components/ui/button";
import { Home } from 'lucide-react';
import { Separator } from "src/components/ui/separator";

import { cn } from "src/lib/utils";
import FullLogo from "../../shared/logo/FullLogo";

import Profile from "./Profile";
import LightDark from "./Light-Dark";


const Header = () => {
  return (
    <>
      <header className={cn(`sticky top-0 z-2 bg-background border-b border-border`)}>
        <nav>
          <div className="mx-auto flex flex-wrap items-center justify-between p-2">
            <div className="flex gap-2 items-center">
              {/* w-8 recorta o logo no ícone (32px): o nome faz parte do próprio SVG. */}
              <div className="block mx-2 w-8 overflow-hidden">
                <FullLogo />
              </div>

              {/* Sem o sidebar, este é o atalho para a tela principal da aplicação. */}
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link to="/apps/vagas" />}
              >
                <Home />
                Minhas vagas
              </Button>




               {/* <Separator
                orientation="vertical"
                className="w-px h-5 mx-2 bg-border self-center max-lg:hidden"
              /> */}

 <Separator
                orientation="vertical"
                className="h-4 mr-4 w-px  ml-2   bg-border self-center max-lg:hidden"
              />


              {/* Nome do produto: só identificação, sem link. */}
              <span className="sm:block hidden text-sm font-semibold">Recruiter Visual</span>
            </div>

            <div className="flex sm:gap-1 gap-0 items-center">
              {/* Theme Toggle */}
              <LightDark />

              {/* Profile Dropdown */}
              <Profile />
            </div>
          </div>
        </nav>
      </header>
    </>
  );
};

export default Header;
