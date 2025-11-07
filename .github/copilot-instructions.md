# Repository Instructions for GitHub Copilot

## Package Manager

This project uses **pnpm** as the package manager, NOT npm.

### Setup Requirements

1. **Node.js**: Use the latest LTS version of Node.js
2. **pnpm**: Use Corepack to enable pnpm (preferred method)

### Installing Dependencies

```bash
# Enable corepack (comes with Node.js 16.13+)
corepack enable

# Install dependencies
pnpm install
```

If corepack is not available:
```bash
npm install -g pnpm
pnpm install
```

### Important Rules

- **NEVER commit `package-lock.json`** - This file should not exist in this repository
- Always use `pnpm` commands, not `npm`:
  - `pnpm install` instead of `npm install`
  - `pnpm run build` instead of `npm run build`
  - `pnpm test` instead of `npm test`
- The project specifies the exact pnpm version in `package.json` under `packageManager`
- Only commit `pnpm-lock.yaml` for dependency locks

### Common Commands

```bash
pnpm run build     # Build the project
pnpm test          # Run tests with coverage
```
