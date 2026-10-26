import { JobCategory } from '@/types';
import {
  Sparkles, Trees, Package, PaintRoller, Car, PartyPopper, HardHat,
  Wrench, Zap, Hammer, Flame, Grid3x3, Cog, SunMedium, Laptop, Globe, MoreHorizontal,
} from 'lucide-react-native';
import { COLORS } from '@/constants/theme';

const ICON_MAP: Record<JobCategory, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Cleaning: Sparkles,
  Gardening: Trees,
  'Moving Assistance': Package,
  Painting: PaintRoller,
  'Car Washing': Car,
  'Event Assistance': PartyPopper,
  'General Labour': HardHat,
  Plumbing: Wrench,
  Electrical: Zap,
  Carpentry: Hammer,
  Welding: Flame,
  Tiling: Grid3x3,
  Mechanics: Cog,
  'Solar Installation': SunMedium,
  Digital: Laptop,
  Remote: Globe,
  Other: MoreHorizontal,
};

interface ServiceIconProps {
  category: JobCategory;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function ServiceIcon({ category, size = 20, color = COLORS.secondary, strokeWidth = 2 }: ServiceIconProps) {
  const Icon = ICON_MAP[category];
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
