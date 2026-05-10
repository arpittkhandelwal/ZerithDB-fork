// @zerithdb/sdk — public API
export { createApp } from "./create-app.js";
export type { ZerithDBApp } from "./create-app.js";

// Re-export commonly used types from @zerithdb/core
export type {
  ZerithDBConfig,
  SyncConfig,
  AuthConfig,
  NetworkConfig,
  Document,
  DocumentId,
  CollectionName,
  QueryFilter,
  UpdateSpec,
  InsertResult,
  Identity,
  PeerInfo,
  SyncState,
} from "@zerithdb/core";

export { ZerithDBError, ErrorCode } from "@zerithdb/core";
