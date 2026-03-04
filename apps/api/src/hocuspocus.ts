import { Server } from "@hocuspocus/server";
import { db } from "@noted/db";
import { documents } from "@noted/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "./auth";
import * as Y from "yjs";

const hocuspocusPort = parseInt(process.env.HOCUSPOCUS_PORT || "4002");

export const hocuspocus = new Server({
  port: hocuspocusPort,
  debounce: 2000,
  quiet: true,

  async onAuthenticate({ requestHeaders }) {
    const cookie = requestHeaders.cookie;
    if (!cookie) {
      return {};
    }

    const headers = new Headers();
    headers.set("cookie", cookie);

    try {
      const session = await auth.api.getSession({ headers });
      if (session) {
        return { user: session.user };
      }
    } catch (e) {
      console.error("[Hocuspocus] Auth check failed, allowing connection:", e);
    }

    return {};
  },

  async onLoadDocument({ document, documentName }) {
    const pageId = parseInt(documentName);
    if (isNaN(pageId)) return;

    console.log(`[Hocuspocus] Loading document ${pageId}`);

    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.pageId, pageId));

    if (doc?.data) {
      const update = new Uint8Array(doc.data);
      Y.applyUpdate(document, update);
      console.log(`[Hocuspocus] Loaded ${update.length} bytes for doc ${pageId}`);
    } else {
      console.log(`[Hocuspocus] No stored data for doc ${pageId}`);
    }
  },

  async onChange({ documentName, document }) {
    console.log(`[Hocuspocus] onChange: ${documentName}`);
  },

  async onStoreDocument({ documentName, document }) {
    const pageId = parseInt(documentName);
    if (isNaN(pageId)) return;

    const state = Buffer.from(Y.encodeStateAsUpdate(document));
    console.log(`[Hocuspocus] Storing doc ${pageId}: ${state.length} bytes`);

    try {
      await db
        .insert(documents)
        .values({
          pageId,
          data: state,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: documents.pageId,
          set: {
            data: state,
            updatedAt: new Date(),
          },
        });
      console.log(`[Hocuspocus] Stored doc ${pageId} OK`);
    } catch (e) {
      console.error(`[Hocuspocus] Store failed for doc ${pageId}:`, e);
    }
  },

  async onConnect({ documentName }) {
    console.log(`[Hocuspocus] Connected: ${documentName}`);
  },

  async onDisconnect({ documentName }) {
    console.log(`[Hocuspocus] Disconnected: ${documentName}`);
  },
});

export { hocuspocusPort };
