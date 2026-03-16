import {
  AlertCircle,
  AlignJustify,
  ArrowUpRight,
  Bolt,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleGauge,
  Cookie,
  Disc,
  Disc3,
  Download,
  Eye,
  EyeOff,
  Github,
  Home,
  Info,
  KeyRound,
  Linkedin,
  // Status
  type LucideProps,
  Minus,
  MoreVertical,
  Pause,
  Play,
  Plus,
  QrCode,
  Repeat,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Square,
  Trash2,
  Turntable,
  Twitter,
  Upload,
  X,
  Youtube,
} from "lucide-react";

// ================================================================
// -------------------------- ICON CONFIG -------------------------
// ================================================================

type IconSizeVariant = "sm" | "md" | "lg";

// Override LucideProps to restrict size to our variants only
interface IconProps extends Omit<LucideProps, "size"> {
  size?: IconSizeVariant;
}

interface IconConfig extends Partial<LucideProps> {
  size?: IconSizeVariant;
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
  color?: string;
}

// Global icon configuration - change these values to set defaults
export const iconConfig: IconConfig = {
  size: "md",
  strokeWidth: 2,
  absoluteStrokeWidth: false,
  color: "currentColor",
};

// Icon size variants
export const iconSizes = {
  sm: "2.25rem",
  md: "3rem",
  lg: "4rem",
};

// Helper to merge config with props
const withConfig = (IconComponent: any) => {
  return (props: IconProps) => {
    // Handle size - check if it's a variant or a rem string
    const size = props.size || iconConfig.size;
    let style = props.style || {};

    // Map size variants to rem values
    const sizeMap: Record<string, string> = {
      sm: iconSizes.sm,
      md: iconSizes.md,
      lg: iconSizes.lg,
    };

    if (typeof size === "string") {
      // Check if it's a variant ( personal note: check if size is in sizeMap)
      const remValue = sizeMap[size];
      if (remValue) {
        // It's a variant, use the mapped rem value
        const remSize = remValue;

        style = {
          ...style,
          flexShrink: 0,
          width: remSize,
          height: remSize,
        };
        // Remove size from props so lucide doesn't override our CSS
        const { size: _, ...restProps } = props;

        const mergedProps = {
          ...iconConfig,
          ...restProps,
          style,
          size: undefined, // Ensure lucide doesn't set its own size
        };
        return <IconComponent {...mergedProps} />;
      }
    }

    // For numeric values or fallback
    const mergedProps = {
      ...iconConfig,
      ...props,
      size,
    };
    return <IconComponent {...mergedProps} />;
  };
};

// ================================================================
// ---------------------------- ICONS -----------------------------
// ================================================================

export const Icon = {
  Home: withConfig(Home),
  ChevronDown: withConfig(ChevronDown),
  Play: withConfig(Play),
  Pause: withConfig(Pause),
  Repeat: withConfig(Repeat),
  Stop: withConfig(Square),
  X: withConfig(X),
  Check: withConfig(Check),
  Reset: withConfig(RotateCcw),
  Info: withConfig(Info),
  Settings2: withConfig(Settings2),
  Disc3: withConfig(Disc3),
  CircleGauge: withConfig(CircleGauge),
  Turntable: withConfig(Turntable),
  ChevronRight: withConfig(ChevronRight),
  ChevronLeft: withConfig(ChevronLeft),
  Plus: withConfig(Plus),
  Github: withConfig(Github),
  Linkedin: withConfig(Linkedin),
  Twitter: withConfig(Twitter),
  Youtube: withConfig(Youtube),
  Bolt: withConfig(Bolt),
  ArrowUpRight: withConfig(ArrowUpRight),
  Discord: withConfig(Disc), // Lucide doesn't have Discord, using Disc as placeholder
  Minus: withConfig(Minus),
  Circle: withConfig(Circle),
  Download: withConfig(Download),
  Upload: withConfig(Upload),
  Eye: withConfig(Eye),
  EyeOff: withConfig(EyeOff),
  Menu: withConfig(AlignJustify),
  Cookie: withConfig(Cookie),
  Search: withConfig(Search),
  Trash: withConfig(Trash2),
  MoreVertical: withConfig(MoreVertical),
  // 2FA Tutorial icons
  Smartphone: withConfig(Smartphone),
  QrCode: withConfig(QrCode),
  KeyRound: withConfig(KeyRound),
  ShieldCheck: withConfig(ShieldCheck),
  AlertCircle: withConfig(AlertCircle),
  SlidersHorizontal: withConfig(SlidersHorizontal),
};

// Type for icon keys
export type IconName = keyof typeof Icon;
