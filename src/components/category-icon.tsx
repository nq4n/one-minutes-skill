import {
  Paintbrush,
  Wrench,
  ChefHat,
  Mountain,
  Code,
  Film,
  Brain,
  MessageCircle,
  Puzzle,
  RefreshCcw,
  Clock,
  Users,
  type LucideIcon,
  HelpCircle,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Paintbrush,
  Wrench,
  ChefHat,
  Mountain,
  Code,
  Film,
  Brain,
  MessageCircle,
  Puzzle,
  RefreshCcw,
  Clock,
  Users,
};

interface CategoryIconProps {
  name: string;
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = iconMap[name] || HelpCircle;
  return <Icon className={className} />;
}
