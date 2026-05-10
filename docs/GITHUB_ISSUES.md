# ZerithDB — First 10 GitHub Issues

> Copy these into GitHub Issues. Apply labels as specified.

---

## Issue #1

**Title:** `[good-first-issue] Add $regex filter operator to CollectionClient.find()`

**Labels:** `good-first-issue`, `enhancement`, `db`

**Difficulty:** ⭐ Beginner

**Description:**

The `CollectionClient.find()` method currently supports `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, and `$nin` operators.

We need to add a `$regex` operator so developers can do:

```typescript
const results = await app.db("notes").find({
  title: { $regex: /meeting/i },
});
```

**Acceptance Criteria:**
- Add `$regex` support to the `QueryFilter` type in `packages/core/src/types/db.ts`
- Implement the match logic in `CollectionClient.matchesFilter()` in `packages/db/src/db-client.ts`
- Add unit tests covering: basic regex match, case-insensitive flag, no-match case
- Update the `QueryFilter` TSDoc comment with a `$regex` example

**Files to touch:**
- `packages/core/src/types/db.ts`
- `packages/db/src/db-client.ts`
- `tests/unit/db.test.ts`

**Resources:**
- [MDN RegExp](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)
- Existing operators in `matchesFilter()` as reference

---

## Issue #2

**Title:** `[good-first-issue] Add $exists filter operator to CollectionClient.find()`

**Labels:** `good-first-issue`, `enhancement`, `db`

**Difficulty:** ⭐ Beginner

**Description:**

Add a `$exists` operator so developers can query for documents where a field is present or absent:

```typescript
// Documents that HAVE a 'dueDate' field
await app.db("tasks").find({ dueDate: { $exists: true } });

// Documents that DO NOT have a 'deletedAt' field
await app.db("tasks").find({ deletedAt: { $exists: false } });
```

**Acceptance Criteria:**
- `$exists: true` — matches documents where the field key is present (even if value is `null` or `undefined`)
- `$exists: false` — matches documents where the field key is absent
- Unit tests: both true/false cases, edge case with `null` value
- Types updated in `QueryFilter`

---

## Issue #3

**Title:** `[good-first-issue] Implement CollectionClient.findOne() convenience method`

**Labels:** `good-first-issue`, `enhancement`, `db`

**Difficulty:** ⭐ Beginner

**Description:**

Add a `findOne()` method that returns the first matching document or `undefined`:

```typescript
const todo = await app.db("todos").findOne({ done: false });
// → Document<Todo> | undefined
```

Currently developers must do `(await find({ done: false }))[0]` which is verbose. `findOne()` short-circuits after the first match for efficiency.

**Acceptance Criteria:**
- Returns `Document<T> | undefined`
- Stops scanning after first match (do not load all documents first)
- Full TypeScript generics preserved
- Unit tests: match found, no match, empty collection

---

## Issue #4

**Title:** `[help-wanted] Implement Yjs Awareness for real-time peer presence`

**Labels:** `help-wanted`, `enhancement`, `sync`

**Difficulty:** ⭐⭐ Intermediate

**Description:**

Yjs has a built-in [Awareness protocol](https://docs.yjs.dev/api/about-awareness) for sharing ephemeral peer state (cursor position, online indicator, custom metadata) without persisting it to the CRDT document.

We want to expose this via the SDK so apps can show who else is online:

```typescript
// Set local awareness state
app.sync.awareness.setLocalState({ cursor: { line: 3, col: 12 }, status: "active" });

// Get all peers' states
const peers = app.sync.awareness.getStates();
// Map<number, AwarenessState>

// Subscribe to changes
app.sync.awareness.on("change", (states) => { ... });
```

**Acceptance Criteria:**
- Add `awareness` property to `SyncEngine` using Yjs `Awareness` class
- Wire awareness updates through the `NetworkManager` (separate message type: `"awareness"`)
- Export `AwarenessState` type from `@zerithdb/core`
- Integration test: two mocked peers exchange awareness updates
- TSDoc on all public awareness APIs

**Resources:**
- [Yjs Awareness docs](https://docs.yjs.dev/api/about-awareness)
- `packages/sync/src/sync-engine.ts`

---

## Issue #5

**Title:** `[help-wanted] Add React hooks package (@zerithdb/react)`

**Labels:** `help-wanted`, `enhancement`, `high-impact`

**Difficulty:** ⭐⭐ Intermediate

**Description:**

React is the most common frontend framework. We need a `@zerithdb/react` package that provides idiomatic React hooks:

```typescript
import { useQuery, useLiveQuery, useAuth, usePeers } from "@zerithdb/react";

function TodoList() {
  const { data: todos, loading } = useLiveQuery(
    app.db("todos"),
    { done: false }
  );
  const { identity } = useAuth(app);
  const { count } = usePeers(app);
  // ...
}
```

**Acceptance Criteria:**
- New package `packages/react/` following same structure as other packages
- Hooks: `useQuery(collection, filter?)`, `useLiveQuery(collection, filter?)`, `useAuth(app)`, `usePeers(app)`, `useSyncState(app)`
- `useLiveQuery` re-renders when underlying data changes (polling or event-driven)
- Full TypeScript generics — `useLiveQuery<Todo>(...)` preserves the `Todo` type
- Peer-reviewed API design before implementation starts (post API design as a comment)
- Unit tests with `@testing-library/react`

---

## Issue #6

**Title:** `[core] Implement storage quota monitoring and ZerithDBError(DB_QUOTA_EXCEEDED)`

**Labels:** `core`, `help-wanted`, `enhancement`

**Difficulty:** ⭐⭐ Intermediate

**Description:**

IndexedDB storage is not unlimited. Browsers impose per-origin quotas (commonly 60% of available disk). Apps built on ZerithDB need visibility into remaining storage and graceful handling when the quota is exceeded.

**Requirements:**

1. Add a `StorageManager` utility to `@zerithdb/db`:

```typescript
const storage = app.db.storage;
const estimate = await storage.estimate();
// { used: 1234567, quota: 5000000000, percentUsed: 24.7 }

storage.on("quota-warning", (estimate) => {
  // fires at 80% usage
});
```

2. When a Dexie write fails with a `QuotaExceededError`, wrap it in `ZerithDBError(ErrorCode.DB_QUOTA_EXCEEDED, ...)` instead of letting the raw Dexie error bubble.

**Acceptance Criteria:**
- `StorageManager` class with `estimate()` and `"quota-warning"` event
- `QuotaExceededError` from Dexie correctly mapped to `ZerithDBError(DB_QUOTA_EXCEEDED)`
- Unit tests with mocked `navigator.storage.estimate`

---

## Issue #7

**Title:** `[high-impact] Implement WebRTC reconnection with exponential backoff and jitter`

**Labels:** `high-impact`, `core`, `network`

**Difficulty:** ⭐⭐⭐ Advanced

**Description:**

The current `NetworkManager` has a basic `scheduleReconnect()` but it has gaps:

1. It reconnects to the signaling server but does not re-establish individual peer connections that drop mid-session.
2. There is no circuit breaker — if the signaling server is down, it retries indefinitely.
3. Reconnect delay jitter is computed once and not properly randomized per attempt.

**Requirements:**
- Implement full exponential backoff: `delay = min(base * 2^attempt, maxDelay) + random(0, jitter)`
- Add a circuit breaker: after 10 consecutive failures, emit `"network:circuit-open"` and stop retrying (requires manual `network.reset()` to retry)
- When a peer's WebRTC connection drops, attempt to re-signal via the WebSocket before giving up
- Add `network.reset()` public method to manually reset circuit state
- Comprehensive unit tests with mocked timers (`vi.useFakeTimers()`)

**References:**
- [Exponential backoff with jitter (AWS blog)](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- `packages/network/src/network-manager.ts`

---

## Issue #8

**Title:** `[high-impact] Design and implement the @zerithdb/cli `zerithdb types` command`

**Labels:** `high-impact`, `enhancement`, `cli`

**Difficulty:** ⭐⭐⭐ Advanced

**Description:**

A major DX improvement: automatically generate TypeScript types from a ZerithDB schema file so developers get full type safety:

**Schema file (`zerithdb.schema.ts`):**
```typescript
export const schema = defineSchema({
  todos: {
    text: "string",
    done: "boolean",
    priority: "number?",
  },
  messages: {
    text: "string",
    senderId: "string",
  },
});
```

**Generated output (`zerithdb.types.ts`):**
```typescript
export interface Todo { text: string; done: boolean; priority?: number; }
export interface Message { text: string; senderId: string; }
```

**Acceptance Criteria:**
- `zerithdb types --schema ./zerithdb.schema.ts --output ./src/zerithdb.types.ts`
- Support field types: `string`, `number`, `boolean`, `string[]`, `number[]`, optional fields with `?`
- Generated types work with `app.db<Todo>("todos").find(...)`
- CLI integration test
- Documentation in `docs/cli/types.md`

---

## Issue #9

**Title:** `[good-first-issue] Add `insertOrUpdate()` (upsert) method to CollectionClient`

**Labels:** `good-first-issue`, `enhancement`, `db`

**Difficulty:** ⭐ Beginner

**Description:**

Add a convenience `insertOrUpdate()` method (upsert) that inserts a document if it doesn't exist, or updates it if a matching document is found:

```typescript
// Upsert by a unique field
await app.db("users").insertOrUpdate(
  { githubId: "12345" },   // filter
  { name: "Alice", email: "alice@example.com" }  // data
);
```

This avoids the common pattern of `findOne()` → check → `insert()` or `update()`.

**Acceptance Criteria:**
- `insertOrUpdate(filter, data)` — inserts if no match, replaces matching document's non-`_id` fields if found
- Returns `{ id: string; created: boolean }` (whether it was inserted or updated)
- Unit tests: insert path, update path, multiple matches throws `ZerithDBError(DB_WRITE_FAILED)`

---

## Issue #10

**Title:** `[high-impact][core] Design the ZerithDB plugin system architecture`

**Labels:** `high-impact`, `core`, `enhancement`

**Difficulty:** ⭐⭐⭐ Advanced

**Description:**

ZerithDB v1.0 will include a plugin system so the community can extend core functionality. This issue is for **designing the plugin API** (not implementing it yet).

**We want:**
```typescript
const app = createApp({
  appId: "my-app",
  plugins: [
    encryptionPlugin({ algorithm: "AES-GCM" }),
    analyticsPlugin({ endpoint: "https://..." }),
    schemaValidationPlugin({ schema }),
  ],
});
```

Plugins should be able to:
1. **Hook into DB writes/reads** — e.g. encrypt before write, decrypt after read
2. **Hook into sync updates** — e.g. filter or transform before broadcast
3. **Extend the `app` object** — e.g. `app.analytics.track(...)`
4. **Add lifecycle hooks** — `onInit`, `onDispose`, `onPeerConnect`

**Task:**
Open a RFC (Request for Comments) Discussion with:
1. Proposed plugin API surface
2. Hook execution order (are they composable? middleware-style?)
3. TypeScript type challenges (how do plugins extend `ZerithDBApp`?)
4. Performance considerations (sync hooks are on the hot path)
5. Security model (can plugins see raw encryption keys?)

Post the RFC, gather feedback for 2 weeks, then open a follow-up implementation issue.

This is a great issue for experienced contributors who want to shape the architecture of ZerithDB.
