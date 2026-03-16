import { memo, useEffect, useRef, useState } from "react";

import { type Scope, animate, createScope, stagger, utils } from "animejs";

import { flow } from "#/components/custom/animations/flow";
import { Icon } from "#/components/ui/icon";

interface AboutItemProps {
  title: string;
  description: string;
  number: number;
  animation?: React.ReactNode;
}

function AboutItem({ title, description, number, animation }: AboutItemProps) {
  return (
    <>
      <strong className="about__item-number">
        / {number === 2 ? "02 COOMING SOON" : Number(number).toString().padStart(2, "0")}
      </strong>
      <div className="about__item-animation">{animation}</div>
      <div className="about__item-content">
        <p className="about__item-description">{description}</p>
        <h3 className="about__item-title">{title}</h3>
      </div>
    </>
  );
}

const WebAppAnimation = memo(function WebAppAnimation({ isTriggered }: { isTriggered: boolean }) {
  const root = useRef<HTMLDivElement | null>(null);
  const scope = useRef<Scope | null>(null);

  const runAnimation = () => {
    if (!root.current) return;
    const prefix = "web-app-animation";
    const searchIcon = utils.$(`.${prefix}-search-icon`);
    const searchInput = utils.$(`.${prefix}-search-input`);
    const bars = utils.$(`.${prefix}-loading-bar`);
    const skeletonHeader = utils.$(`.${prefix}-skeleton-header`);
    const skeletonContent = utils.$(`.${prefix}-skeleton-content`);

    utils.set(searchIcon, {
      opacity: 0,
      top: "50%",
      left: "85%",
      translateX: "-50%",
      translateY: "-50%",
    });

    utils.set(searchInput, { opacity: 0 });

    utils.set(bars, { opacity: 0 });

    utils.set(skeletonHeader, { opacity: 0, translateY: "25%" });
    utils.set(skeletonContent, { opacity: 0, translateY: "25%" });

    scope.current = createScope({ root: root.current }).add(() => {
      // Search animations
      animate(searchIcon, {
        opacity: 1,
        duration: 300,
        ease: "easeInOut",
        delay: 300,
      });

      animate(searchInput, {
        opacity: 1,
        duration: 300,
        ease: "easeInOut",
        delay: 300,
        onComplete: () => {
          const p = searchInput[0]?.querySelector("p");
          if (p) {
            const textToWrite = "Crosspad.app";
            let index = 0;
            const timer = setInterval(() => {
              if (index <= textToWrite.length) {
                p.textContent = textToWrite.slice(0, index);
                index++;
              } else {
                clearInterval(timer);
                animate(searchIcon, {
                  scale: 0.85,
                  duration: 150,
                  ease: "easeInOut",
                  delay: 300,
                  onComplete: () => {
                    animate(searchIcon, {
                      scale: 1,
                      duration: 150,
                      ease: "easeInOut",
                      delay: 150,
                      onComplete: () => {
                        animate([searchIcon, searchInput], {
                          opacity: 0,
                          duration: 300,
                          ease: "easeInOut",
                          delay: 150,
                          onComplete: () => {
                            // Clear the search input text
                            const p = searchInput[0]?.querySelector("p");
                            if (p) {
                              p.textContent = "";
                            }
                            // Show and animate loading bars
                            utils.set(bars, { opacity: 0.1 });
                            animate(bars, {
                              opacity: [0.1, 1],
                              duration: 500,
                              direction: "alternate",
                              loop: 1,
                              delay: stagger(50),
                              easing: "easeInOutQuad",
                              onComplete: () => {
                                animate(bars, {
                                  opacity: 0,
                                  duration: 300,
                                  delay: stagger(50),
                                  easing: "easeInOutQuad",
                                  onComplete: () => {
                                    animate([skeletonHeader, skeletonContent], {
                                      opacity: 1,
                                      translateY: "0%",
                                      duration: 300,
                                      ease: "easeInOut",
                                      delay: stagger(50),
                                      onComplete: () => {
                                        // Hold skeleton for a moment, then exit upward
                                        setTimeout(() => {
                                          animate([skeletonHeader, skeletonContent], {
                                            opacity: 0,
                                            translateY: "-25%",
                                            duration: 300,
                                            ease: "easeInOut",
                                            delay: stagger(50),
                                            onComplete: () => {
                                              // Restart the animation
                                              setTimeout(runAnimation, 500);
                                            },
                                          });
                                        }, 3000);
                                      },
                                    });
                                  },
                                });
                              },
                            });
                          },
                        });
                      },
                    });
                  },
                });
              }
            }, 100);
          }
        },
      });
    });
  };

  useEffect(() => {
    if (!isTriggered) return;
    runAnimation();
    return () => scope.current?.revert();
  }, [isTriggered]);

  return (
    <div className="web-app-animation">
      <div ref={root} className="web-app-animation-screen">
        <div className="web-app-animation-nav">
          <div className="web-app-animation-dot"></div>
          <div className="web-app-animation-dot"></div>
          <div className="web-app-animation-dot"></div>
        </div>
        <div className="web-app-animation-content">
          <div className="web-app-animation-search-input">
            <p></p>
          </div>
          <Icon.Search className="web-app-animation-search-icon" />
          <div className="web-app-animation-loading">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="web-app-animation-loading-bar"></div>
            ))}
          </div>
          <div className="web-app-animation-skeleton">
            <div className="web-app-animation-skeleton-header"></div>
            <div className="web-app-animation-skeleton-content"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

const MobileAppAnimation = memo(function MobileAppAnimation({
  isTriggered,
}: {
  isTriggered: boolean;
}) {
  const root = useRef<HTMLDivElement | null>(null);
  const scope = useRef<Scope | null>(null);

  useEffect(() => {
    if (!root.current || !isTriggered) return;

    const squares = utils.$(`.mobile-app-animation-square`);

    // Create a pattern that builds a square from the center outward
    const createSquarePattern = () => {
      const pattern = [];
      const size = 4;
      const center = Math.floor(size / 2);

      // Build outward in layers
      for (let layer = 0; layer <= center; layer++) {
        // Top row of layer
        for (let x = center - layer; x <= center + layer; x++) {
          pattern.push({ x, y: center - layer });
        }
        // Right column (excluding corners already added)
        for (let y = center - layer + 1; y <= center + layer; y++) {
          pattern.push({ x: center + layer, y });
        }
        // Bottom row (excluding corners already added)
        for (let x = center + layer - 1; x >= center - layer; x--) {
          pattern.push({ x, y: center + layer });
        }
        // Left column (excluding corners already added)
        for (let y = center + layer - 1; y >= center - layer + 1; y--) {
          pattern.push({ x: center - layer, y });
        }
      }

      return pattern.map(({ x, y }) => y * size + x);
    };

    const squarePattern = createSquarePattern();

    scope.current = createScope({ root: root.current }).add(() => {
      // Initial state
      utils.set(squares, { opacity: 0, scale: 0 });

      // Build the square
      const buildAnimation = () => {
        animate(squares, {
          opacity: [0, 1],
          scale: [0, 1],
          duration: 150,
          delay: stagger(30, { start: 0 }),
          easing: "easeOutBack",
          onComplete: () => {
            // Hold for a moment then unbuild
            setTimeout(() => {
              animate(squares, {
                opacity: [1, 0],
                scale: [1, 0],
                duration: 150,
                delay: stagger(30, { from: "last" }),
                easing: "easeInQuad",
                onComplete: () => {
                  // Loop the animation
                  setTimeout(buildAnimation, 500);
                },
              });
            }, 1000);
          },
        });
      };

      buildAnimation();
    });

    return () => scope.current?.revert();
  }, [isTriggered]);

  return (
    <div className="mobile-app-animation">
      <div ref={root} className="mobile-app-animation-screen">
        <div className="mobile-app-animation-content">
          <div className="mobile-app-animation-grid">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="mobile-app-animation-square"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export function About() {
  const [webAppRevealed, setWebAppRevealed] = useState(false);

  const handleAnimationComplete = () => {
    setWebAppRevealed(true);
  };

  return (
    <section id="about" className="about">
      <flow.container
        className="about__container"
        stagger={0.3}
        threshold={0.2}
        onAnimationComplete={handleAnimationComplete}
      >
        {/* Web App - First item triggers the animation when it appears */}
        <flow.div className="about__item">
          <AboutItem
            title="Web App"
            description="You can play Crosspad app inside your browser, through keyboard,
              mobile or even MIDI devices!"
            number={1}
            animation={<WebAppAnimation isTriggered={webAppRevealed} />}
          />
        </flow.div>

        {/* Mobile App */}
        <flow.div delay={0.1} className="about__item">
          <AboutItem
            title="Mobile App"
            description="Experience Crosspad on the go with our native mobile app, coming soon to iOS and Android."
            number={2}
            animation={<MobileAppAnimation isTriggered={webAppRevealed} />}
          />
        </flow.div>
      </flow.container>
    </section>
  );
}
