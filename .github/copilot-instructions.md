# Repository Instructions for GitHub Copilot

## Project Overview

**node-json-db** is a lightweight, file-based JSON database for Node.js/TypeScript with zero production dependencies. Key features:

- **DataPath navigation**: XPath-like syntax (`/users/0/name`, `/items[]`, `/data[-1]`) to navigate nested JSON data
- **Async-first API**: All database operations return Promises (async/await)
- **Optional AES-256-GCM encryption**: Via `config.setEncryption(key32bytes)`, stored as `.enc.json`
- **Concurrency safety**: Built-in reader-writer locks prevent race conditions
- **Pluggable adapters**: `IAdapter<T>` interface for custom storage backends
- **Automatic persistence**: `saveOnPush: true` (default) writes to disk on every `push()`/`delete()`
- **Generic type-safe retrieval**: `getObject<T>(path)` and `getObjectDefault<T>(path, default)`

---

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
pnpm run build     # Build the project (TypeScript → dist/)
pnpm test          # Run all tests with coverage (jest --coverage)
pnpm run build:doc # Generate TypeDoc API documentation (→ docs/)
```

---

## Architecture & Directory Structure

```
node-json-db/
├── src/                              # TypeScript source (compiled to dist/)
│   ├── JsonDB.ts                    # Main exported class — all public API methods
│   ├── adapter/
│   │   ├── IAdapter.ts              # Interface: readAsync() / writeAsync()
│   │   ├── data/
│   │   │   └── JsonAdapter.ts       # JSON serialize/deserialize + date revival
│   │   └── file/
│   │       ├── FileAdapter.ts       # Raw filesystem I/O
│   │       └── CipheredFileAdapter.ts  # AES-256-GCM encryption layer
│   ├── lib/
│   │   ├── JsonDBConfig.ts          # Config & ConfigWithAdapter classes
│   │   ├── Errors.ts                # DatabaseError / DataError (extend NestedError)
│   │   ├── ArrayInfo.ts             # Array path parsing (e.g. items[0], items[])
│   │   ├── DBParentData.ts          # Parent node resolution for writes/deletes
│   │   └── Utils.ts                 # merge(), removeTrailingChar(), KeyValue type
│   └── lock/
│       ├── Lock.ts                  # readLockAsync() / writeLockAsync() helpers
│       ├── ReadWriteLock.ts         # High-perf reader-writer lock with pooling
│       └── Error.ts                 # TimeoutError class
├── test/                            # Jest test suite (ts-jest)
│   ├── 01-utils.test.ts            # ArrayInfo regex + safe-regex ReDoS tests
│   ├── 02-jsondb.test.ts           # Core CRUD, merge, types, errors
│   ├── 03-existing-db.test.ts      # File persistence and reload
│   ├── 04-array-utils.test.ts      # Array indexing, append, nested arrays
│   ├── 05-errors-test.ts           # Error types and DataPath error codes
│   ├── 06-concurrency.test.ts      # Lock timeouts, concurrent access
│   ├── 07-cyphered.test.ts         # Encryption key validation, encrypt/decrypt
│   ├── ArrayInfo.test.ts           # Unit tests for ArrayInfo class
│   ├── DBParentData.test.ts        # Unit tests for DBParentData class
│   ├── JsonDB.test.ts              # Unit tests for JsonDB class
│   ├── adapter/
│   │   └── adapters.test.ts        # Unit tests for adapters
│   └── lock/                       # Lock unit tests
├── dist/                            # Compiled JS output (git-ignored, built by tsc)
├── jest.config.js                   # Jest configuration (preset: ts-jest)
├── tsconfig.json                    # TypeScript config (strict, commonjs, esnext)
└── package.json                     # Scripts, devDependencies, commitlint config
```

**Adapter chain**: `JsonDB → JsonAdapter → (CipheredFileAdapter | FileAdapter)`

---

## TypeScript Conventions

- **Strict mode** is enabled (`"strict": true` in `tsconfig.json`) — no implicit `any`
- **Target**: `esnext` compiled to `commonjs` for Node.js compatibility
- **Naming**:
  - Classes/Interfaces: `PascalCase` (e.g., `JsonDB`, `ArrayInfo`, `IAdapter`)
  - Private class members: prefixed with `_` (e.g., `_filename`)
  - Methods/variables: `camelCase`
- **Visibility**: Mark implementation details `private`, keep the public API minimal
- **Generics**: Use generic type parameters for type-safe retrieval (e.g., `getObject<T>()`)
- **Imports**: Named imports from relative paths; no barrel `index.ts` files
- **JSDoc**: Required for all public API methods and configuration options

---

## Public API Reference

### `JsonDB` class (`src/JsonDB.ts`)

All methods are async and protected by reader-writer locks internally.

| Method | Signature | Description |
|--------|-----------|-------------|
| `push` | `push(path, data, override=true)` | Write data; `override=false` deep-merges |
| `getData` | `getData(path): Promise<any>` | Read data; throws `DataError` if not found |
| `getObject<T>` | `getObject<T>(path): Promise<T>` | Type-safe read |
| `getObjectDefault<T>` | `getObjectDefault<T>(path, default?)` | Read with fallback value |
| `exists` | `exists(path): Promise<boolean>` | Check if path exists |
| `delete` | `delete(path): Promise<void>` | Remove node at path |
| `count` | `count(arrayPath): Promise<number>` | Array length |
| `getIndex` | `getIndex(path, value, prop='id')` | Find array index by property value |
| `getIndexValue` | `getIndexValue(path, value)` | Find array index by value |
| `find<T>` | `find<T>(rootPath, callback)` | First match in array/object |
| `filter<T>` | `filter<T>(rootPath, callback)` | All matches in array/object |
| `fromPath` | `fromPath(routePath, prop='id')` | Convert route-style path to DataPath |
| `load` | `load(): Promise<void>` | Manually load from file (auto-called) |
| `save` | `save(force?): Promise<void>` | Manually save to file |
| `reload` | `reload(): Promise<void>` | Reload from disk, discarding in-memory state |
| `resetData` | `resetData(data): void` | ⚠️ Replaces all in-memory data directly |

### `Config` class (`src/lib/JsonDBConfig.ts`)

```typescript
new Config(
  filename: string,        // File path (auto-appends .json if no extension)
  saveOnPush: boolean,     // Default: true — save after every push/delete
  humanReadable: boolean,  // Default: false — pretty-print JSON
  separator: string,       // Default: '/' — DataPath separator
  syncOnSave: boolean,     // Default: false — fsync after writes
  parseDates: boolean      // Default: true — revive ISO date strings
)

config.setEncryption(key: CipherKey)
// key must be exactly 32 bytes (Buffer, string, or symmetric KeyObject)
// Changes filename from .json → .enc.json (idempotent)
```

### `ConfigWithAdapter` class

```typescript
new ConfigWithAdapter(
  adapter: IAdapter<any>,  // Custom adapter implementation
  saveOnPush: boolean,     // Default: true
  separator: string        // Default: '/'
)
```

---

## DataPath Syntax

DataPaths use `/` as the default separator (configurable):

| Path | Meaning |
|------|---------|
| `/` | Root object |
| `/users` | `users` property of root |
| `/users/0/name` | `name` of first user |
| `/items[0]` | First element of `items` array |
| `/items[]` | Append new element to `items` array |
| `/items[-1]` | Last element of `items` array |
| `/matrix[0][1]` | Nested array access |
| `/items[]/id` | Append new object and set its `id` property |

---

## Error Handling

All errors extend `NestedError` which includes `message`, `id` (numeric code), and optional `inner` (wrapped error).

```typescript
import { DatabaseError, DataError } from 'node-json-db'

// DataError — problems with path or data (ids 3–13, 100, 200)
//   id 3: Can't merge another type with Array
//   id 4: Can't merge Array with Object
//   id 5: Path not found (used by getObjectDefault to return default)
//   id 10: Can't find array index
//   id 11: Target is not an array
//   id 12: filter/find on non-array/non-object
//   id 13: fromPath value not found
//   id 100: Can't get/delete appended data
//   id 200: Non-numeric array index

// DatabaseError — I/O or load/save issues (ids 1–2, 7)
//   id 1: Can't load database
//   id 2: Can't save database
//   id 7: Database not loaded, can't write
```

---

## Encryption

Encrypted databases use AES-256-GCM via Node.js `crypto`:

```typescript
import { Config } from 'node-json-db'
import { randomBytes } from 'crypto'

const config = new Config('mydb', true)
const key = randomBytes(32)  // Must be exactly 32 bytes
config.setEncryption(key)    // filename: mydb.json → mydb.enc.json

// Encrypted file format (JSON):
// { "iv": "<hex>", "tag": "<hex>", "data": "<hex>" }
// A fresh IV and tag are generated on every write for security
```

- Accepts: `Buffer` (32 bytes), `string` (32 chars), or symmetric `KeyObject` (256-bit)
- Asymmetric keys are rejected with an `Error`
- The `.enc.json` extension prevents accidental unencrypted access

---

## Testing Conventions

- **Framework**: Jest 30 with `ts-jest` preset (no compilation step needed for tests)
- **Run tests**: `pnpm test` — runs all tests with coverage
- **Run single file**: `pnpm test -- test/02-jsondb.test.ts`
- **Temporary files**: Use `/tmp/<uuid>` paths (via `randomUUID()`) or `test/` directory with cleanup
- **Cleanup**: Always add `afterEach` hooks to remove test files created during tests
- **Test file naming**: Numbered files (`01-`, `02-`) are integration tests; unnumbered are unit tests
- **Coverage**: Reported to codecov via CI

### Test patterns

```typescript
// Cleanup pattern (used in integration tests)
afterEach(() => {
  try { fs.rmSync(testFile + ".json") } catch (e) {}
})

// Temporary encrypted DB pattern (in encryption tests)
const getDbPath = () => `/tmp/${randomUUID()}`
afterEach(() => {
  const files = ['/tmp/test.enc.json', '/tmp/test.json']
  files.forEach(f => { if (existsSync(f)) unlinkSync(f) })
})
```

---

## Commit Message Conventions

This repository enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint`:

```
<type>: <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
```

Examples:
- `feat: add support for custom separators`
- `fix: prevent race condition in concurrent writes`
- `test: add coverage for encryption key validation`
- `docs: update README with encryption examples`

The `body-max-line-length` rule is disabled (long PR descriptions allowed).

---

## CI/CD Pipeline

**Trigger branches**: `develop` (PRs & pushes), `master` (PRs, pushes, and releases)

### `nodejs.yml` — Build & Test
- Runs on Node.js `lts/*` and `current` (matrix)
- Steps: `pnpm install` → `pnpm test` → upload coverage to Codecov

### `release.yml` — Release (master only)
- `build` job: same as above
- `ci-cd-check`: dry-run `semantic-release`
- `deploy-pages`: builds TypeDoc → deploys to GitHub Pages
- `release`: runs `semantic-release` → publishes to npm + creates GitHub Release

### `codeql-analysis.yml` — Security Scanning
- Runs CodeQL analysis on pushes/PRs to master/develop

**Release automation**: `semantic-release` reads conventional commits to determine version bump and generates `CHANGELOG.md` automatically.

---

## Adapter Pattern

To implement a custom storage backend, implement `IAdapter<T>`:

```typescript
import { IAdapter } from 'node-json-db'

class MyAdapter implements IAdapter<string> {
  async readAsync(): Promise<string | null> {
    // Return raw string data or null if not found
  }
  async writeAsync(data: string): Promise<void> {
    // Persist raw string data
  }
}

// Use with ConfigWithAdapter:
import { JsonDB, ConfigWithAdapter } from 'node-json-db'
const db = new JsonDB(new ConfigWithAdapter(new JsonAdapter(new MyAdapter())))
```

The `JsonAdapter` wraps a `string`-based adapter and handles JSON serialization/deserialization (including optional date revival). The `FileAdapter` → `CipheredFileAdapter` extend chain is the built-in file-based implementation.

---

## Known Patterns & Gotchas

1. **`push()` with `override=false`** merges recursively for objects, concatenates for arrays, and skips `null` values
2. **`getObjectDefault<T>()`** catches only `DataError` with `id === 5` (path not found); other errors still propagate
3. **`getData("/")`** returns the entire root object
4. **Array index caching**: `ArrayInfo.processArray()` caches regex results in `regexCache` for performance
5. **Concurrency**: `readLockAsync`/`writeLockAsync` from `src/lock/Lock.ts` wrap all public read/write operations; custom adapter implementations do not need to add their own locking
6. **Date parsing**: Enabled by default (`parseDates: true`); ISO 8601 strings are automatically revived as `Date` objects
7. **File auto-created**: The JSON file is only created on the first `save()` (triggered by `push()`/`delete()` with `saveOnPush: true`); the file does NOT exist after a bare `new JsonDB(config)` call
8. **`fromPath()`**: Converts Express-style routes (e.g., `/users/123`) to DataPaths using `getIndex()` internally
