---
trigger: model_decision
description: When writing or reviewing comments in code. Covers when to comment, formats, and anti-patterns.
---

# Comment Standards

## Core Principle

**Comments explain WHY, not WHAT.** Code is self-documenting for what it does.

## When to Comment

✅ **Do comment:**

- Business logic intent
- Workarounds with context (`// Safari 14 doesn't support...`)
- Security/performance decisions
- TODOs with dates: `// TODO[2025-03-01]: Migrate to v2`

❌ **Never comment:**

- Obvious code (`const count = items.length; // Get count`)
- Function names that match behavior
- Commented-out code (use git)

## Formats

### JSDoc (public functions in `app/lib/`, `server/`)

```typescript
/** Validates credentials and returns JWT session token */
async login(email: string, password: string): Promise<string | null>
```

### Inline (complex logic only)

```typescript
// Debounce to prevent API spam (300ms matches typing latency)
const debouncedSearch = useMemo(() => debounce(searchAPI, 300), [searchAPI]);
```

### Section separators (files >200 lines only)

```typescript
// ──────────────────────────────────────────────────────────────
// Event Handlers
// ──────────────────────────────────────────────────────────────
```

## Anti-Patterns

```typescript
// ❌ The Obvious
const count = items.length; // Get the number of items

// ❌ The Noise
function getUser() {
  // Return the user
  return user;
}

// ❌ The Excuse
// This is messy but it works

// ✅ The Workaround (good)
// Temporary fix for vendor API bug #12345 - remove after 2025-03-01
```
