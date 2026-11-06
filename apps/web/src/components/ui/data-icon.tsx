import {
  BookOpen,
  Braces,
  Bug,
  ChartNoAxesColumnIncreasing,
  Check,
  ChefHat,
  CodeXml,
  Coffee,
  Compass,
  Database,
  Flame,
  FlaskConical,
  Hexagon,
  Layers3,
  Network,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Z365Icon, type Z365IconName } from "@/components/ui/z365-icon";

const z365Glyphs: Record<string, Z365IconName> = {
  book: "learn",
  code: "practice",
  layers: "projects",
  flask: "labs",
  sparkles: "agents",
  coffee: "java",
  database: "database",
  network: "network",
  bug: "debug",
};

const icons: Record<string, LucideIcon> = {
  book: BookOpen,
  braces: Braces,
  bug: Bug,
  chart: ChartNoAxesColumnIncreasing,
  check: Check,
  chef: ChefHat,
  code: CodeXml,
  coffee: Coffee,
  compass: Compass,
  database: Database,
  flame: Flame,
  flask: FlaskConical,
  hexagon: Hexagon,
  layers: Layers3,
  network: Network,
  sparkles: Sparkles,
  zap: Zap,
};

export function DataIcon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  if (z365Glyphs[name])
    return (
      <Z365Icon name={z365Glyphs[name]} size={size} className={className} />
    );
  const Icon = icons[name] || CodeXml;
  return (
    <Icon
      size={size}
      strokeWidth={1.8}
      className={className}
      aria-hidden="true"
    />
  );
}
