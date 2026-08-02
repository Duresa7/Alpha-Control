import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type HoloVariant = "default" | "ghost" | "danger";
type HoloSize = "sm" | "md";

export interface HoloMicroExpanderProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  icon: React.ReactNode;
  variant?: HoloVariant;
  size?: HoloSize;
  isActive?: boolean;
  isLoading?: boolean;
}

const SIZES: Record<HoloSize, {
  collapsed: number;
  label: string;
  labelTrail: number;
}> = {
  sm: { collapsed: 40, label: "text-[10px]", labelTrail: 16 },
  md: { collapsed: 48, label: "text-[11px]", labelTrail: 20 },
};

const VARIANT_STYLES: Record<HoloVariant, { base: string; hover: string }> = {
  default: {
    base: "border-white/15 text-white/85",
    hover:
      "hover:border-[color:var(--holo-amber)] hover:text-[color:var(--holo-amber-bright)] hover:bg-[rgba(200,170,110,0.10)] focus-visible:border-[color:var(--holo-amber)] focus-visible:text-[color:var(--holo-amber-bright)]",
  },
  ghost: {
    base: "border-transparent text-white/80",
    hover:
      "hover:border-white/20 hover:text-white focus-visible:border-white/20 focus-visible:text-white",
  },
  danger: {
    base: "border-[rgba(220,20,60,0.28)] text-[color:var(--holo-crimson)] bg-[rgba(220,20,60,0.06)]",
    hover:
      "hover:border-[rgba(220,20,60,0.55)] hover:bg-[rgba(220,20,60,0.18)] hover:text-[#ff6b86]",
  },
};

const BACKDROP: React.CSSProperties = {
  background:
    "linear-gradient(160deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(10, 12, 18, 0.5)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  boxShadow:
    "inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 10px 24px -10px rgba(0, 0, 0, 0.55)",
};

export const HoloMicroExpander = React.forwardRef<
  HTMLButtonElement,
  HoloMicroExpanderProps
>(function HoloMicroExpander(
  {
    text,
    icon,
    variant = "default",
    size = "md",
    isActive = false,
    isLoading = false,
    className,
    style,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    disabled,
    ...rest
  },
  ref,
) {
  const [isHovered, setIsHovered] = React.useState(false);
  const dims = SIZES[size];
  const palette = VARIANT_STYLES[variant];
  const expanded = isHovered && !isLoading;
  const iconSize = dims.collapsed;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={text}
      aria-pressed={isActive || undefined}
      disabled={isLoading || disabled}
      className={cn(
        "relative inline-flex items-center align-middle overflow-hidden",
        "rounded-full border whitespace-nowrap text-left",
        "font-semibold uppercase",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--holo-amber)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50",
        "cursor-pointer",
        size === "sm" ? "h-10" : "h-12",
        palette.base,
        palette.hover,
        isActive &&
          "border-[rgba(200,170,110,0.45)] text-[color:var(--holo-amber)] bg-[rgba(200,170,110,0.18)]",
        isLoading && "cursor-not-allowed",
        disabled && !isLoading && "opacity-40 cursor-not-allowed",
        className,
      )}
      style={{
        ...BACKDROP,
        transition:
          "color 200ms ease-out, background-color 200ms ease-out, border-color 200ms ease-out, box-shadow 200ms ease-out",
        ...style,
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
      onFocus={(e) => {
        setIsHovered(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsHovered(false);
        onBlur?.(e);
      }}
      onClick={(e) => {
        if (isLoading) return;
        onClick?.(e);
      }}
      {...rest}
    >
      <span
        className="grid place-items-center shrink-0 z-10"
        style={{ width: iconSize, height: iconSize }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {isLoading ? (
            <motion.span
              key="spinner"
              initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.span>
          ) : (
            <motion.span
              key="icon"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.18 }}
              className="flex"
            >
              {icon}
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      <span
        className="overflow-hidden shrink-0"
        style={{
          maxWidth: expanded ? "1000px" : "0px",
          transition: "max-width 280ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <motion.span
          animate={{ opacity: expanded ? 1 : 0 }}
          transition={{
            duration: 0.22,
            delay: expanded ? 0.08 : 0,
            ease: "easeOut",
          }}
          className={cn("block whitespace-nowrap tracking-[0.08em]", dims.label)}
          style={{
            fontFamily: "Oxanium, Orbitron, monospace",
            width: "max-content",
            minWidth: "max-content",
            paddingRight: dims.labelTrail,
          }}
          aria-hidden
        >
          {text}
        </motion.span>
      </span>
    </button>
  );
});
