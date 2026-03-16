---
description: Generate design tokens documentation
auto_execution_mode: 3
---

# Generate Tokens Documentation

Update `.windsurf/rules/tokens.md` with current design tokens.

## Steps

1. Read `app/style/abstracts/_tokens.scss`
2. Read UI component variants from `app/components/ui/*.tsx`
3. Update `.windsurf/rules/tokens.md` with:
   - Typography tokens
   - Color tokens (OKLCH)
   - Spacing values
   - Radius/shadow tokens
   - Available UI components and their variants
