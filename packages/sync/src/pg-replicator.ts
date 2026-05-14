import type { DbClient } from "zerithdb-db";
import { ZerithDBError, ErrorCode } from "zerithdb-core";

export interface PGReplicationConfig {
  url: string;
  tableMap: Record<string, string>; // PG table name -> ZerithDB collection name
}

export type PGChange = {
  table: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  record: Record<string, any>;
  old_record?: Record<string, any>;
};

/**
 * Replicates PostgreSQL change streams (WAL) into local ZerithDB collections.
 * Typically connects to a server-side relay (e.g. Supabase Realtime).
 */
export class PostgresReplicator {
  private ws: WebSocket | null = null;

  constructor(
    private readonly db: DbClient,
    private readonly config: PGReplicationConfig
  ) {}

  /**
   * Start listening to the PG change stream.
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
      } catch (err) {
        reject(new Error(`Failed to connect to PG replication stream: ${err}`));
        return;
      }

      this.ws.onopen = () => {
        console.log("ZerithDB: Connected to PG replication stream");
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const change = JSON.parse(event.data) as PGChange;
          void this.handlePGChange(change);
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onerror = (err) => {
        console.error("ZerithDB: PG replication stream error", err);
      };
    });
  }

  /**
   * Stop the replication stream.
   */
  stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private async handlePGChange(change: PGChange): Promise<void> {
    const collectionName = this.config.tableMap[change.table];
    if (!collectionName) return;

    const collection = this.db.collection(collectionName);

    try {
      switch (change.type) {
        case "INSERT":
          await collection.insert(change.record);
          break;
        case "UPDATE":
          // Assuming record has an _id or we use a mapping
          const id = change.record._id || change.record.id;
          if (id) {
            await collection.update({ _id: id } as any, { $set: change.record });
          }
          break;
        case "DELETE":
          const deleteId = change.old_record?._id || change.old_record?.id;
          if (deleteId) {
            await collection.delete({ _id: deleteId } as any);
          }
          break;
      }
    } catch (err) {
      console.warn(`ZerithDB: Failed to apply PG change to "${collectionName}"`, err);
    }
  }
}
