import { Home, LucideIcon } from 'lucide-react';

interface profileType {
  avatar: LucideIcon;
  title: string;
  href: string;
  badge: boolean;
}

const profileDD: profileType[] = [
  {
    avatar: Home,
    title: 'Home',
    href: '/apps/vagas',
    badge: false
  }
];

export { profileDD };
