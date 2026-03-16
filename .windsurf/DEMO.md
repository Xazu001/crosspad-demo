## Final checklist

- [ ] `.env` generated with placeholders (run: `pnpm script demo/generate-env-example`)
- [ ] `wrangler.jsonc` generated with placeholders (run: `pnpm script demo/generate-wrangler-template`)
- [ ] `wrangler.dev.jsonc` removed
- [ ] `wrangler.prod.jsonc` removed
- [ ] `shared/constants/site.ts` without actual URLs, replaced with "XXXXXX"
- [ ] `shared/constants/legal.ts` without personal data, replaced with "XXXXXX"
- [ ] `package.json` without production scripts
- [ ] Demo scripts in `scripts/demo/` work:
  - [ ] `pnpm script demo/generate-env-example` (creates `.env`)
  - [ ] `pnpm script demo/generate-wrangler-template` (creates `wrangler.jsonc`)
  - [ ] `pnpm script demo/delete-comments` (optional, removes comments)
- [ ] The `DEMO.md` exists and covers setup process and what to change info
- [ ] Git history is clean
- [ ] Test on a clean environment passed

---

## Setup Scripts (available in `scripts/demo/`)

| Script                          | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| `generate-env-example.ts`       | Creates `.env` with placeholders                      |
| `generate-wrangler-template.ts` | Creates `wrangler.jsonc` template (backs up existing) |
| `delete-comments.ts`            | Strips comments from generated files (optional)       |

### Usage

```bash
pnpm script demo/generate-env-example
pnpm script demo/generate-wrangler-template
pnpm script demo/delete-comments  # optional
```
