import discardDuplicates from "postcss-discard-duplicates";

export default {
  plugins: [
    discardDuplicates(),
    // PostCSS plugins will be added here if needed
    // Currently using Vite's built-in PostCSS processing
  ],
};
