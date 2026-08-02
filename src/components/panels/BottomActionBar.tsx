import { motion } from "framer-motion";
import { Globe, Rocket, SlidersHorizontal } from "lucide-react";
import { useGalaxyUIStore } from "@/store/galaxyUIStore";
import { useRole } from "@/hooks/useRole";
import { CustomPlanetsPanel } from "@/components/panels/CustomPlanetsPanel";
import { CustomFleetsPanel } from "@/components/panels/CustomFleetsPanel";
import { HoloMicroExpander } from "@/components/panels/HoloMicroExpander";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useFloating, offset, flip, shift, autoUpdate } from "@floating-ui/react-dom";

export function BottomActionBar() {
  const { isAdmin } = useRole();
  const activeModule = useGalaxyUIStore((s) => s.activeModule);
  const setActiveModule = useGalaxyUIStore((s) => s.setActiveModule);

  return (
    <motion.div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
      data-tour="bottom-action-bar"
    >
      <div className="flex items-center gap-3">
        <HoloMicroExpander
          size="md"
          text="Map Controls"
          isActive={activeModule === "mapControls"}
          onClick={() => setActiveModule("mapControls")}
          icon={<SlidersHorizontal className="w-4 h-4" aria-hidden="true" />}
        />

        {isAdmin && (
          <>
            <PanelTriggerWrapper
              component={<CustomPlanetsPanel />}
              label="Create Planet"
              activeModule={activeModule}
              onOpen={() => setActiveModule(null)}
              icon={<Globe className="w-4 h-4" aria-hidden="true" />}
            />
            <PanelTriggerWrapper
              component={<CustomFleetsPanel />}
              label="Create Fleet"
              activeModule={activeModule}
              onOpen={() => setActiveModule(null)}
              icon={<Rocket className="w-4 h-4" aria-hidden="true" />}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}

function PanelTriggerWrapper({
  component,
  label,
  icon,
  activeModule,
  onOpen,
}: {
  component: React.ReactNode;
  label: string;
  icon: React.ReactNode;
  activeModule: string | null;
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (activeModule === "mapControls") {
      setOpen(false);
    }
  }, [activeModule]);

  // Floating UI keeps the panel anchored on scroll and resize, and flips or
  // shifts it when the trigger sits too close to a screen edge.
  const { refs, floatingStyles } = useFloating({
    placement: "top",
    strategy: "fixed",
    middleware: [offset(16), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const panel = refs.floating.current;
      const button = refs.reference.current as HTMLElement | null;
      if (
        panel &&
        !panel.contains(target) &&
        button &&
        !button.contains(target) &&
        !target.closest(".fleet-modal-overlay")
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, refs]);

  return (
    <>
      <HoloMicroExpander
        ref={refs.setReference}
        size="md"
        text={label}
        isActive={open}
        icon={icon}
        onClick={() => {
          const next = !open;
          if (next) onOpen();
          setOpen(next);
        }}
      />

      {open &&
        createPortal(
          <div ref={refs.setFloating} className="w-72 z-50" style={floatingStyles}>
            <div className="animate-slide-up-subtle">{component}</div>
          </div>,
          document.body,
        )}
    </>
  );
}
