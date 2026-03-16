import { type HTMLMotionProps, type Variants, motion } from "framer-motion";

import { cn } from "#/components/utils";

// ================================================================
// ----------------------- FLOW MOTION ----------------------------
// ================================================================
// Pre-configured motion components with default reveal animations
// Usage: <flow.div>, <flow.section>, <flow.article>, etc.

/** Animation direction for flow reveal */
type FlowDirection = "up" | "down" | "left" | "right" | "none";

/** Core flow configuration options */
interface FlowConfig {
  /** Animation direction - default: "up" */
  direction?: FlowDirection;
  /** Animation duration in seconds - default: 0.6 */
  duration?: number;
  /** Delay before animation starts in seconds - default: 0 */
  delay?: number;
  /** Distance in pixels for the slide - default: 40 */
  distance?: number;
  /** Custom easing curve - default: [0.25, 0.1, 0.25, 1] */
  ease?: [number, number, number, number];
  /** How much of the element must be visible to trigger (0-1) - default: 0.2 */
  threshold?: number;
  /** Margin around the element to trigger earlier/later - default: "0px" */
  margin?: string;
  /** Only animate once - default: true */
  once?: boolean;
  /** Scale from value (1 = no scale) - default: 1 */
  scaleFrom?: number;
  /** Initial opacity - default: 0 */
  initialOpacity?: number;
}

/** Valid HTML element tags for flow components */
type FlowElementTag =
  | "div"
  | "section"
  | "article"
  | "span"
  | "li"
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4";

/** Props for flow motion components */
type FlowComponentProps<T extends FlowElementTag = "div"> = Omit<
  HTMLMotionProps<T>,
  "initial" | "animate" | "variants" | "onAnimationComplete"
> &
  FlowConfig & {
    /** Callback when animation completes */
    onAnimationComplete?: () => void;
  };

const getOffset = (direction: FlowDirection, distance: number) => {
  switch (direction) {
    case "up":
      return { y: distance, x: 0 };
    case "down":
      return { y: -distance, x: 0 };
    case "left":
      return { y: 0, x: distance };
    case "right":
      return { y: 0, x: -distance };
    case "none":
      return { y: 0, x: 0 };
  }
};

/** Default flow configuration */
const defaultFlowConfig: Required<FlowConfig> = {
  direction: "up",
  duration: 0.6,
  delay: 0,
  distance: 40,
  ease: [0.25, 0.1, 0.25, 1],
  threshold: 0.2,
  margin: "0px",
  once: true,
  scaleFrom: 1,
  initialOpacity: 0,
};

/** Create variants based on flow configuration */
const createFlowVariants = (config: Required<FlowConfig>): Variants => {
  const offset = getOffset(config.direction, config.distance);

  return {
    hidden: {
      opacity: config.initialOpacity,
      y: offset.y,
      x: offset.x,
      scale: config.scaleFrom,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: config.duration,
        delay: config.delay,
        ease: config.ease,
      },
    },
  };
};

/** Merge user config with defaults */
const mergeConfig = (props: FlowConfig): Required<FlowConfig> => ({
  ...defaultFlowConfig,
  ...props,
});

// ================================================================
// ---------------------- FLOW COMPONENTS --------------------------
// ================================================================

/** Pre-configured motion.div with default reveal animation */
const FlowDiv = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"div">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

/** Pre-configured motion.section with default reveal animation */
const FlowSection = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"section">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.section
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.section>
  );
};

/** Pre-configured motion.article with default reveal animation */
const FlowArticle = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"article">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.article
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.article>
  );
};

/** Pre-configured motion.span with default reveal animation */
const FlowSpan = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"span">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.span
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.span>
  );
};

/** Pre-configured motion.li with default reveal animation */
const FlowLi = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"li">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.li
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.li>
  );
};

/** Pre-configured motion.p with default reveal animation */
const FlowP = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"p">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.p
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.p>
  );
};

/** Pre-configured motion.h1 with default reveal animation */
const FlowH1 = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"h1">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.h1
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.h1>
  );
};

/** Pre-configured motion.h2 with default reveal animation */
const FlowH2 = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"h2">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.h2
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.h2>
  );
};

/** Pre-configured motion.h3 with default reveal animation */
const FlowH3 = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"h3">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.h3
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.h3>
  );
};

/** Pre-configured motion.h4 with default reveal animation */
const FlowH4 = ({
  children,
  direction = defaultFlowConfig.direction,
  duration = defaultFlowConfig.duration,
  delay = defaultFlowConfig.delay,
  distance = defaultFlowConfig.distance,
  ease = defaultFlowConfig.ease,
  threshold = defaultFlowConfig.threshold,
  margin = defaultFlowConfig.margin,
  once = defaultFlowConfig.once,
  scaleFrom = defaultFlowConfig.scaleFrom,
  initialOpacity = defaultFlowConfig.initialOpacity,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowComponentProps<"h4">) => {
  const config = mergeConfig({
    direction,
    duration,
    delay,
    distance,
    ease,
    threshold,
    margin,
    once,
    scaleFrom,
    initialOpacity,
  });

  const variants = createFlowVariants(config);

  return (
    <motion.h4
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{
        once: config.once,
        amount: config.threshold,
        margin: config.margin,
      }}
      variants={variants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.h4>
  );
};

/** Flow container component for staggered children animations */
interface FlowContainerProps extends Omit<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "variants" | "onAnimationComplete"
> {
  children: React.ReactNode;
  /** Stagger delay between children in seconds - default: 0.1 */
  stagger?: number;
  /** Delay before animation starts in seconds - default: 0 */
  delay?: number;
  /** How much of the element must be visible to trigger (0-1) - default: 0.2 */
  threshold?: number;
  /** Margin around the element to trigger earlier/later - default: "0px" */
  margin?: string;
  /** Only animate once - default: true */
  once?: boolean;
  /** Additional className */
  className?: string;
  /** Callback when all children animations complete */
  onAnimationComplete?: () => void;
}

const FlowContainer = ({
  children,
  stagger = 0.1,
  delay = 0,
  threshold = 0.2,
  margin = "0px",
  once = true,
  className,
  onAnimationComplete,
  ...motionProps
}: FlowContainerProps) => {
  const containerVariants: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold, margin }}
      variants={containerVariants}
      onAnimationComplete={onAnimationComplete}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

// ================================================================
// ---------------------- FLOW EXPORT ------------------------------
// ================================================================

/**
 * Pre-configured motion components with default reveal animations.
 *
 * Default config:
 * - direction: "up"
 * - duration: 0.6s
 * - distance: 40px
 * - ease: [0.25, 0.1, 0.25, 1]
 * - threshold: 0.2
 * - once: true
 * - initialOpacity: 0
 *
 * @example
 * ```tsx
 * <flow.div>
 *   Content slides up with fade in
 * </flow.div>
 *
 * <flow.div direction="left" distance={60} duration={0.8}>
 *   Slides from left with custom settings
 * </flow.div>
 *
 * <flow.container stagger={0.15}>
 *   <flow.div>First item</flow.div>
 *   <flow.div>Second item (staggered)</flow.div>
 * </flow.container>
 * ```
 */
const flow = {
  div: FlowDiv,
  section: FlowSection,
  article: FlowArticle,
  span: FlowSpan,
  li: FlowLi,
  p: FlowP,
  h1: FlowH1,
  h2: FlowH2,
  h3: FlowH3,
  h4: FlowH4,
  container: FlowContainer,
};

export { flow };
export type { FlowConfig, FlowComponentProps, FlowContainerProps, FlowDirection, FlowElementTag };
