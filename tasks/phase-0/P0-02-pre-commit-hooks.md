# P0-02: Pre-Commit Hooks (Husky + lint-staged + commitlint)

| Field                  | Value                                                         |
| ---------------------- | ------------------------------------------------------------- |
| **Task ID**            | P0-02                                                         |
| **Phase**              | 0 — Foundation                                                |
| **Category**           | Quality                                                       |
| **Suggested Assignee** | DevOps Engineer                                               |
| **Depends On**         | P0-00 (Project Scaffolding)                                   |
| **Blocks**             | P0-05 (Testing), P0-07 (CI/CD)                                |
| **Estimated Effort**   | 1 day                                                         |
| **Module References**  | [Module 06 §5.12](../modules/06-INFRASTRUCTURE-AND-DEVOPS.md) |

---

## Context

Commits with lint errors, type failures, or inconsistent formatting currently reach the remote repository, increasing code review burden and CI failure rates. Pre-commit hooks will catch these issues locally before a commit is created.

---

## Deliverables

### 1. Install and Configure Husky

- Install `husky` as a dev dependency
- Add `"prepare": "husky"` script to `package.json`
- Initialize Husky directory (`.husky/`)

### 2. Configure `pre-commit` Hook

Create `.husky/pre-commit` that runs `npx lint-staged`.

### 3. Configure lint-staged

Create `.lintstagedrc.json` with the following rules:

| File Pattern               | Commands                                |
| -------------------------- | --------------------------------------- |
| `*.{ts,tsx}`               | `eslint --fix`, then `prettier --write` |
| `*.{json,yml,yaml,css,md}` | `prettier --write`                      |
| `*.prisma`                 | `prisma format`                         |

### 4. Configure commitlint

- Install `@commitlint/cli` and `@commitlint/config-conventional`
- Create `commitlint.config.ts` extending `@commitlint/config-conventional`
- Allowed commit types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`
- Rules: subject required, no trailing period, max 100 chars; body max 200 chars per line; scope lowercase
- Create `.husky/commit-msg` hook running `npx commitlint --edit "$1"`

---

## Acceptance Criteria

- [ ] `npm install` (or equivalent) automatically sets up Husky hooks via the `prepare` script
- [ ] A commit with a lint error in a `.ts` file is blocked; the error is shown to the developer
- [ ] A commit with a formatting inconsistency in a `.json` file auto-fixes the formatting and stages the fix
- [ ] A commit with message `"fixed stuff"` is rejected by commitlint with a clear error explaining the expected format
- [ ] A commit with message `"fix: resolve login redirect loop"` passes commitlint
- [ ] `*.prisma` files are formatted via `prisma format` on commit
- [ ] Hooks do not run on CI (Husky auto-skips when `CI=true`)
