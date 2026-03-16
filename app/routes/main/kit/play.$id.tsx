// Main page for playing a launchpad kit with multi-touch support
import { createResourceUrl } from "@/constants";

import { useEffect, useRef, useState } from "react";

import { useLoaderData } from "react-router";

import { ClientOnly } from "#/components/custom/client-only";
import { Nav } from "#/components/custom/nav";
import { Pad } from "#/components/custom/pad";
import { KitPlayDesktopMenu } from "#/components/pages/main/play/desktop-menu";
import { KitPlayMobileMenu } from "#/components/pages/main/play/mobile-menu";
import { PadProvider } from "#/lib/contexts/PadContext";
import { PanelProvider, usePanelState } from "#/lib/contexts/PanelContext";
import { useAudioFocus } from "#/lib/hooks/useAudioFocus";
import { useBreakpoint } from "#/lib/hooks/useIsMobile";
import { useKitMidi } from "#/lib/hooks/useKitMidi";
import { usePadsTranslation } from "#/lib/hooks/usePadsTranslation";
import { createMeta } from "#/lib/seo";
import { useCreateKitStore } from "#/lib/stores/createKit";
import { useEditKitStore } from "#/lib/stores/editKit";
import { usePlayKit } from "#/lib/stores/playKit";
import {
  transformCreateKitToServerFormat,
  transformEditKitToServerFormat,
} from "#/lib/utils/kit-transformer";

import type { Route } from "./+types/play.$id";
import { loader } from "./play.$id.server";

// ──────────────────────────────────────────────────────────────

/** Generate meta tags for kit page */
export const meta: Route.MetaFunction = ({ matches, loaderData }) => {
  return createMeta(matches, {
    title: `${loaderData.owner.user_name}'s kit - ${loaderData.kit_name}`,
    description:
      loaderData.kit_description ||
      `Play ${loaderData.kit_name} by ${loaderData.owner.user_name} on Crosspad`,
  });
};

// Re-export for React Router route discovery
export { loader };

/** Main kit play page component */
function KitPlayPage() {
  const loaderData = useLoaderData<typeof loader>();
  const kit = loaderData;
  const isInitializingRef = useRef(false);
  const isMobile = useBreakpoint("desktop");

  // Mute audio when page loses focus (tab switch, minimize, etc.)
  useAudioFocus();

  // Initialize MIDI controller for pad input
  useKitMidi();

  // Initialize kit and audio
  const {
    initializeKit,
    isInitialized,
    isLoading,
    loadingProgress,
    loadingErrors,
    closeAudioContext,
  } = usePlayKit();

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      closeAudioContext();
    };
  }, [closeAudioContext]);

  // Initialize kit when loaded
  useEffect(() => {
    if (kit && !isInitialized && !isLoading && !isInitializingRef.current) {
      isInitializingRef.current = true;
      initializeKit(kit)
        .finally(() => {
          isInitializingRef.current = false;
        })
        .catch(console.error);
    }
  }, [kit, isInitialized, isLoading, initializeKit]);

  // Apply kit colors to body for portals (Modals, Selects, etc.)
  useEffect(() => {
    if (!kit) return;

    const root = document.documentElement;
    const colors = {
      "--kit-play-color-main": kit.colors.main,
      "--kit-play-color-main-hover": kit.colors.mainHover,
      "--kit-play-color-main-foreground": kit.colors.mainForeground,
      "--kit-play-color-border": kit.colors.border,
      "--kit-play-color-card": kit.colors.card,
      "--kit-play-color-card-border": kit.colors.cardBorder,
      "--kit-play-color-background": kit.colors.background,
      "--kit-play-color-foreground": kit.colors.foreground,
    };

    Object.entries(colors).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value);
    });

    return () => {
      Object.keys(colors).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [kit]);

  return (
    <>
      <PlayNav />
      <PanelProvider>
        <PadProvider>
          <main
            className="kit-play-main"
            style={
              {
                "--kit-play-color-main": kit.colors.main,
                "--kit-play-color-main-hover": kit.colors.mainHover,
                "--kit-play-color-main-foreground": kit.colors.mainForeground,
                "--kit-play-color-border": kit.colors.border,
                "--kit-play-color-card": kit.colors.card,
                "--kit-play-color-card-border": kit.colors.cardBorder,
                "--kit-play-color-background": kit.colors.background,
                "--kit-play-color-foreground": kit.colors.foreground,
              } as React.CSSProperties
            }
          >
            <section className="kit-play">
              <Loading
                padsLength={kit.pads.length}
                loadedPads={loadingProgress.loadedPads}
                isInitialized={isInitialized}
                loadingErrors={loadingErrors}
              />
              <ClientOnly>{isMobile ? <MobileWithMenu /> : <DesktopWithMenu />}</ClientOnly>
            </section>
          </main>
        </PadProvider>
      </PanelProvider>
    </>
  );
}

export default function Index() {
  return <KitPlayPage />;
}

// ================================================================
// --------------------- DESKTOP VIEW ------------------------------
// ================================================================

function DesktopWithMenu() {
  const { kit } = usePlayKit();
  const { isAnyPanelActive } = usePanelState();

  return (
    <>
      <div className="kit-play-desktop__container">
        <div className="kit-play-desktop__pads">
          <div
            className={`kit-play-desktop__pads-container ${isAnyPanelActive ? "kit-play-desktop__pads-container--active" : ""}`}
          >
            {kit?.pads.map((el, index) => (
              <Pad key={el.pad_id} pad={el} index={index} deviceType="desktop" />
            ))}
          </div>
        </div>
        <KitPlayDesktopMenu />
      </div>
    </>
  );
}

// ================================================================
// --------------------- MOBILE VIEW -------------------------------
// ================================================================

function MobileWithMenu() {
  const { kit } = usePlayKit();
  const { isAnyPanelActive } = usePanelState();
  const translationValue = usePadsTranslation();

  return (
    <>
      <div className="kit-play-mobile__container">
        <div className="kit-play-mobile__pads">
          <div
            className={`kit-play-mobile__pads-container ${isAnyPanelActive ? "kit-play-mobile__pads-container--active" : ""}`}
            style={
              {
                "--translation-value": translationValue,
              } as React.CSSProperties
            }
          >
            {kit?.pads.map((el, index) => (
              <Pad key={el.pad_id} pad={el} index={index} deviceType="mobile" />
            ))}
          </div>
        </div>
      </div>
      <KitPlayMobileMenu />
    </>
  );
}

// ================================================================
// --------------------- LOADING COMPONENT -------------------------
// ================================================================

function Loading({
  padsLength,
  loadedPads,
  isInitialized,
  loadingErrors,
}: {
  padsLength: number;
  loadedPads: number;
  isInitialized: boolean;
  loadingErrors?: { sampleName: string; error: string }[];
}) {
  const [isVisible, setIsVisible] = useState(true);
  const isFullyLoaded = loadedPads >= padsLength;

  useEffect(() => {
    if (isFullyLoaded && isInitialized && isVisible) {
      // Start fade out animation after a short delay
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [isFullyLoaded, isInitialized, isVisible]);

  return (
    <div
      className={`kit-play__loading ${
        isVisible ? "kit-play__loading--visible" : "kit-play__loading--hidden"
      }`}
    >
      <div className="kit-play__loading-wrapper">
        <img
          src="/assets/logo.png"
          alt="Two green S letters connected into one symbol that are animated with pulsing effect"
          className="kit-play__loading-spinner"
        />
        <div className="kit-play__progress-wrapper">
          <div
            className={`kit-play__progress ${loadingErrors && loadingErrors.length > 0 ? "kit-play__progress--error" : ""}`}
          >
            {loadingErrors && loadingErrors.length > 0
              ? "Loading failed"
              : `${loadedPads}/${padsLength} pads loaded`}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// --------------------- NAVIGATION COMPONENT ----------------------
// ================================================================

function PlayNav() {
  const loaderData = useLoaderData<typeof loader>();

  const { kit_logo_source, kit_name, owner, colors } = loaderData;

  return (
    <Nav
      containerStyle={{
        backgroundColor: colors.card,
      }}
      middleContent={
        <div
          className="nav__kit-play-middle"
          style={{
            flex: "1",
            display: "flex",
            justifyContent: "end",
            paddingRight: "3rem",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <p style={{ textWrap: "nowrap" }}>
            <span style={{ fontWeight: "500" }}>{owner.user_name}</span> - {kit_name}
          </p>
          <img
            src={createResourceUrl("logo", kit_logo_source || "")}
            alt="Kit logo"
            style={{
              height: "4rem",
              aspectRatio: "1",
              objectFit: "contain",
              scale: "1.625",
              marginLeft: "0.5rem",
            }}
          />
        </div>
      }
      rightContent={<div className="nav__kit-play-right" style={{ width: "0" }}></div>}
    />
  );
}

// ================================================================
// --------------------- END OF FILE --------------------------------
// ================================================================

// ================================================================
// --------------------- PREVIEW KIT COMPONENT ---------------------
// ================================================================

interface PreviewKitProps {
  onBack: () => void;
}

export function PreviewKit({ onBack }: PreviewKitProps) {
  const { data } = useCreateKitStore();
  const isInitializingRef = useRef(false);
  const isMobile = useBreakpoint("desktop");

  // Mute audio when page loses focus
  useAudioFocus();

  // Initialize MIDI controller for pad input
  useKitMidi();

  // Transform createKit data to server format for preview
  const kit = transformCreateKitToServerFormat(data);

  // Initialize kit and audio
  const {
    initializeKit,
    isInitialized,
    isLoading,
    loadingProgress,
    loadingErrors,
    closeAudioContext,
  } = usePlayKit();

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      closeAudioContext();
    };
  }, [closeAudioContext]);

  // Initialize kit when loaded
  useEffect(() => {
    if (kit && !isInitialized && !isLoading && !isInitializingRef.current) {
      isInitializingRef.current = true;
      initializeKit(kit)
        .finally(() => {
          isInitializingRef.current = false;
        })
        .catch(console.error);
    }
  }, [kit, isInitialized, isLoading, initializeKit]);

  // Apply kit colors to body for portals (Modals, Selects, etc.)
  useEffect(() => {
    if (!kit) return;

    const root = document.documentElement;
    const colors = {
      "--kit-play-color-main": kit.colors.main,
      "--kit-play-color-main-hover": kit.colors.mainHover,
      "--kit-play-color-main-foreground": kit.colors.mainForeground,
      "--kit-play-color-border": kit.colors.border,
      "--kit-play-color-card": kit.colors.card,
      "--kit-play-color-card-border": kit.colors.cardBorder,
      "--kit-play-color-background": kit.colors.background,
      "--kit-play-color-foreground": kit.colors.foreground,
    };

    Object.entries(colors).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value);
    });

    return () => {
      Object.keys(colors).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [kit]);

  return (
    <>
      <PreviewNav kit={kit} onBack={onBack} />
      <PanelProvider>
        <PadProvider>
          <main
            className="kit-play-main"
            style={
              {
                "--kit-play-color-main": kit.colors.main,
                "--kit-play-color-main-hover": kit.colors.mainHover,
                "--kit-play-color-main-foreground": kit.colors.mainForeground,
                "--kit-play-color-border": kit.colors.border,
                "--kit-play-color-card": kit.colors.card,
                "--kit-play-color-card-border": kit.colors.cardBorder,
                "--kit-play-color-background": kit.colors.background,
                "--kit-play-color-foreground": kit.colors.foreground,
              } as React.CSSProperties
            }
          >
            <section className="kit-play">
              <Loading
                padsLength={kit.pads.length}
                loadedPads={loadingProgress.loadedPads}
                isInitialized={isInitialized}
                loadingErrors={loadingErrors}
              />
              {isMobile ? (
                <MobileWithMenuPreview kit={kit} />
              ) : (
                <DesktopWithMenuPreview kit={kit} />
              )}
            </section>
          </main>
        </PadProvider>
      </PanelProvider>
    </>
  );
}

export function EditPreviewKit({ onBack }: PreviewKitProps) {
  const { data, kitId, existingLogoUrl } = useEditKitStore();
  const isInitializingRef = useRef(false);
  const isMobile = useBreakpoint("desktop");

  // Mute audio when page loses focus
  useAudioFocus();

  // Initialize MIDI controller for pad input
  useKitMidi();

  const kit = transformEditKitToServerFormat(data, kitId || 0, existingLogoUrl);

  const {
    initializeKit,
    isInitialized,
    isLoading,
    loadingProgress,
    loadingErrors,
    closeAudioContext,
  } = usePlayKit();

  useEffect(() => {
    return () => {
      closeAudioContext();
    };
  }, [closeAudioContext]);

  useEffect(() => {
    if (kit && !isInitialized && !isLoading && !isInitializingRef.current) {
      isInitializingRef.current = true;
      initializeKit(kit)
        .finally(() => {
          isInitializingRef.current = false;
        })
        .catch(console.error);
    }
  }, [kit, isInitialized, isLoading, initializeKit]);

  // Apply kit colors to body for portals (Modals, Selects, etc.)
  useEffect(() => {
    if (!kit) return;

    const root = document.documentElement;
    const colors = {
      "--kit-play-color-main": kit.colors.main,
      "--kit-play-color-main-hover": kit.colors.mainHover,
      "--kit-play-color-main-foreground": kit.colors.mainForeground,
      "--kit-play-color-border": kit.colors.border,
      "--kit-play-color-card": kit.colors.card,
      "--kit-play-color-card-border": kit.colors.cardBorder,
      "--kit-play-color-background": kit.colors.background,
      "--kit-play-color-foreground": kit.colors.foreground,
    };

    Object.entries(colors).forEach(([key, value]) => {
      if (value) root.style.setProperty(key, value);
    });

    return () => {
      Object.keys(colors).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [kit]);

  return (
    <>
      <PreviewNav kit={kit} onBack={onBack} />
      <PanelProvider>
        <PadProvider>
          <main
            className="kit-play-main"
            style={
              {
                "--kit-play-color-main": kit.colors.main,
                "--kit-play-color-main-hover": kit.colors.mainHover,
                "--kit-play-color-main-foreground": kit.colors.mainForeground,
                "--kit-play-color-border": kit.colors.border,
                "--kit-play-color-card": kit.colors.card,
                "--kit-play-color-card-border": kit.colors.cardBorder,
                "--kit-play-color-background": kit.colors.background,
                "--kit-play-color-foreground": kit.colors.foreground,
              } as React.CSSProperties
            }
          >
            <section className="kit-play">
              <Loading
                padsLength={kit.pads.length}
                loadedPads={loadingProgress.loadedPads}
                isInitialized={isInitialized}
                loadingErrors={loadingErrors}
              />
              {isMobile ? (
                <MobileWithMenuPreview kit={kit} />
              ) : (
                <DesktopWithMenuPreview kit={kit} />
              )}
            </section>
          </main>
        </PadProvider>
      </PanelProvider>
    </>
  );
}

// Desktop view for preview
function DesktopWithMenuPreview({ kit }: { kit: any }) {
  const { isAnyPanelActive } = usePanelState();

  return (
    <>
      <div className="kit-play-desktop__container">
        <div className="kit-play-desktop__pads">
          <div
            className={`kit-play-desktop__pads-container ${isAnyPanelActive ? "kit-play-desktop__pads-container--active" : ""}`}
          >
            {kit?.pads.map((el: any, index: number) => (
              <Pad key={el.pad_id} pad={el} index={index} deviceType="desktop" />
            ))}
          </div>
        </div>
        <KitPlayDesktopMenu
          previewData={{
            owner: kit.owner,
            kit_description: kit.kit_description,
          }}
        />
      </div>
    </>
  );
}

// Mobile view for preview
function MobileWithMenuPreview({ kit }: { kit: any }) {
  const { isAnyPanelActive } = usePanelState();
  const translationValue = usePadsTranslation();

  return (
    <>
      <div className="kit-play-mobile__container">
        <div className="kit-play-mobile__pads">
          <div
            className={`kit-play-mobile__pads-container ${isAnyPanelActive ? "kit-play-mobile__pads-container--active" : ""}`}
            style={
              {
                "--translation-value": translationValue,
              } as React.CSSProperties
            }
          >
            {kit?.pads.map((el: any, index: number) => (
              <Pad key={el.pad_id} pad={el} index={index} deviceType="mobile" />
            ))}
          </div>
        </div>
      </div>
      <KitPlayMobileMenu
        previewData={{
          owner: kit.owner,
          kit_description: kit.kit_description,
        }}
      />
    </>
  );
}

// Navigation for preview
function PreviewNav({ kit, onBack }: { kit: any; onBack: () => void }) {
  return (
    <Nav
      containerStyle={{
        backgroundColor: kit.colors.card,
      }}
      leftContent={<div style={{ width: "120px" }}></div>}
      middleContent={
        <div
          className="nav__kit-play-middle"
          style={{
            flex: "1",
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: kit.colors.foreground,
              fontSize: "1.6rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            ← Back
          </button>
          <p>
            <span style={{ fontWeight: "500" }}>{kit.owner.user_name}</span> - {kit.kit_name}
          </p>
          {kit.kit_logo_source && (
            <img
              src={kit.kit_logo_source}
              alt="Kit logo"
              style={{ height: "4rem", aspectRatio: "1", objectFit: "contain" }}
            />
          )}
        </div>
      }
      rightContent={<div style={{ width: "120px" }}></div>}
    />
  );
}
