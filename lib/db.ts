import { v4 as uuidv4 } from "uuid";
import { getLocalStore, type LocalLineItemRow } from "./local-store";

export interface Document {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Extraction {
  id: string;
  document_id: string;
  vendor_name: string | null;
  vendor_conf: number | null;
  date: string | null;
  date_conf: number | null;
  total: number | null;
  total_conf: number | null;
  currency: string | null;
  currency_conf: number | null;
  raw_json: string | null;
  is_reviewed: number;
  created_at: string;
}

export interface LineItem {
  id: string;
  extraction_id: string;
  name: string | null;
  quantity: number | null;
  unit_price: number | null;
  subtotal: number | null;
  conf: number | null;
}

type AiField<T> =
  | { value?: T | null; confidence?: number | null }
  | T
  | null
  | undefined;

function parseNumericValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeTextField(field: AiField<string>) {
  if (field && typeof field === "object" && "value" in field) {
    return {
      value: field.value ?? null,
      confidence: field.confidence ?? null,
    };
  }

  if (typeof field === "string" && field.trim()) {
    return { value: field, confidence: null };
  }

  return { value: null, confidence: null };
}

function normalizeNumberField(field: AiField<number | string>) {
  if (field && typeof field === "object" && "value" in field) {
    return {
      value: parseNumericValue(field.value),
      confidence: field.confidence ?? null,
    };
  }

  return { value: parseNumericValue(field), confidence: null };
}

function normalizeAiResult(aiResult: any) {
  const vendor = normalizeTextField(
    aiResult.vendor_name ?? aiResult.vendor ?? aiResult.merchant_name,
  );
  const date = normalizeTextField(aiResult.date ?? aiResult.invoice_date);
  const total = normalizeNumberField(
    aiResult.total ?? aiResult.grand_total ?? aiResult.amount_total,
  );
  const currency = normalizeTextField(aiResult.currency ?? aiResult.curr);
  const lineItems = Array.isArray(aiResult.line_items)
    ? aiResult.line_items
    : Array.isArray(aiResult.items)
      ? aiResult.items
      : [];

  return {
    vendor,
    date,
    total,
    currency,
    lineItems,
    raw: aiResult,
  };
}

// Documents
export async function createDocument(
  db: D1Database | null | undefined,
  data: Omit<Document, "id" | "created_at" | "updated_at">,
) {
  const id = uuidv4();
  const now = new Date().toISOString();

  if (!db) {
    const store = getLocalStore();
    store.documents.set(id, {
      id,
      filename: data.filename,
      file_url: data.file_url,
      file_type: data.file_type,
      status: data.status,
      created_at: now,
      updated_at: now,
    });

    return id;
  }

  await db
    .prepare(
      `INSERT INTO documents (id, filename, file_url, file_type, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      data.filename,
      data.file_url,
      data.file_type,
      data.status,
      now,
      now,
    )
    .run();

  return id;
}

export async function getDocuments(
  db: D1Database | null | undefined,
  filters?: { vendor?: string; date?: string },
) {
  if (!db) {
    const store = getLocalStore();
    const documents = Array.from(store.documents.values())
      .map((document) => {
        const extraction = store.extractions.get(document.id);
        return {
          ...document,
          vendor_name: extraction?.vendor_name ?? null,
          date: extraction?.date ?? null,
          total: extraction?.total ?? null,
          currency: extraction?.currency ?? null,
          is_reviewed: extraction?.is_reviewed ?? 0,
        };
      })
      .filter((document) => {
        if (filters?.vendor && !document.vendor_name) return false;
        if (
          filters?.vendor &&
          !document.vendor_name
            ?.toLowerCase()
            .includes(filters.vendor.toLowerCase())
        ) {
          return false;
        }
        if (filters?.date && document.date !== filters.date) return false;
        return true;
      })
      .sort((left, right) => right.created_at.localeCompare(left.created_at));

    return { results: documents };
  }

  let query = `
    SELECT d.*, e.vendor_name, e.date, e.total, e.currency, e.is_reviewed
    FROM documents d
    LEFT JOIN extractions e ON e.document_id = d.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (filters?.vendor) {
    query += ` AND e.vendor_name LIKE ?`;
    params.push(`%${filters.vendor}%`);
  }

  if (filters?.date) {
    query += ` AND e.date = ?`;
    params.push(filters.date);
  }

  query += ` ORDER BY d.created_at DESC`;

  return db
    .prepare(query)
    .bind(...params)
    .all();
}

export async function getDocumentById(
  db: D1Database | null | undefined,
  id: string,
) {
  if (!db) {
    const store = getLocalStore();
    return store.documents.get(id) ?? null;
  }

  return db.prepare(`SELECT * FROM documents WHERE id = ?`).bind(id).first();
}

export async function updateDocumentStatus(
  db: D1Database | null | undefined,
  id: string,
  status: string,
) {
  const now = new Date().toISOString();

  if (!db) {
    const store = getLocalStore();
    const existing = store.documents.get(id);
    if (existing) {
      store.documents.set(id, {
        ...existing,
        status,
        updated_at: now,
      });
    }
    return;
  }

  await db
    .prepare(`UPDATE documents SET status = ?, updated_at = ? WHERE id = ?`)
    .bind(status, now, id)
    .run();
}

// Extractions
export async function createExtraction(
  db: D1Database | null | undefined,
  documentId: string,
  aiResult: any,
) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const normalized = normalizeAiResult(aiResult);

  if (!db) {
    const store = getLocalStore();
    store.extractions.set(id, {
      id,
      document_id: documentId,
      vendor_name: normalized.vendor.value ?? null,
      vendor_conf: normalized.vendor.confidence ?? null,
      date: normalized.date.value ?? null,
      date_conf: normalized.date.confidence ?? null,
      total: normalized.total.value ?? null,
      total_conf: normalized.total.confidence ?? null,
      currency: normalized.currency.value ?? null,
      currency_conf: normalized.currency.confidence ?? null,
      raw_json: JSON.stringify(normalized.raw),
      is_reviewed: 0,
      created_at: now,
    });

    if (normalized.lineItems.length > 0) {
      const lineItems: LocalLineItemRow[] = normalized.lineItems.map(
        (item: any) => ({
          id: uuidv4(),
          extraction_id: id,
          name: item.name ?? null,
          quantity: item.quantity ?? null,
          unit_price: item.unit_price ?? null,
          subtotal: item.subtotal ?? null,
          conf: item.confidence ?? item.conf ?? null,
        }),
      );

      store.lineItems.set(id, lineItems);
    }

    return id;
  }

  await db
    .prepare(
      `INSERT INTO extractions 
       (id, document_id, vendor_name, vendor_conf, date, date_conf, total, total_conf, currency, currency_conf, raw_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      documentId,
      normalized.vendor.value ?? null,
      normalized.vendor.confidence ?? null,
      normalized.date.value ?? null,
      normalized.date.confidence ?? null,
      normalized.total.value ?? null,
      normalized.total.confidence ?? null,
      normalized.currency.value ?? null,
      normalized.currency.confidence ?? null,
      JSON.stringify(normalized.raw),
      now,
    )
    .run();

  // Insert line items
  if (normalized.lineItems.length > 0) {
    for (const item of normalized.lineItems) {
      const itemId = uuidv4();
      await db
        .prepare(
          `INSERT INTO line_items (id, extraction_id, name, quantity, unit_price, subtotal, conf)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          itemId,
          id,
          item.name ?? null,
          item.quantity ?? null,
          item.unit_price ?? null,
          item.subtotal ?? null,
          item.confidence ?? null,
        )
        .run();
    }
  }

  return id;
}

export async function getExtractionByDocumentId(
  db: D1Database | null | undefined,
  documentId: string,
) {
  if (!db) {
    const store = getLocalStore();
    const extraction = Array.from(store.extractions.values()).find(
      (entry) => entry.document_id === documentId,
    );

    if (!extraction) return null;

    return {
      ...extraction,
      line_items: store.lineItems.get(extraction.id) ?? [],
    };
  }

  const extraction = await db
    .prepare(`SELECT * FROM extractions WHERE document_id = ?`)
    .bind(documentId)
    .first();

  if (!extraction) return null;

  const lineItems = await db
    .prepare(`SELECT * FROM line_items WHERE extraction_id = ?`)
    .bind(extraction.id)
    .all();

  return { ...extraction, line_items: lineItems.results };
}

export async function updateExtraction(
  db: D1Database | null | undefined,
  extractionId: string,
  data: Partial<Extraction>,
) {
  const now = new Date().toISOString();

  if (!db) {
    const store = getLocalStore();
    const existing = store.extractions.get(extractionId);
    if (existing) {
      store.extractions.set(extractionId, {
        ...existing,
        vendor_name: data.vendor_name ?? null,
        date: data.date ?? null,
        total: data.total ?? null,
        currency: data.currency ?? null,
        is_reviewed: 1,
      });

      const document = store.documents.get(existing.document_id);
      if (document) {
        store.documents.set(existing.document_id, {
          ...document,
          updated_at: now,
        });
      }
    }
    return;
  }

  await db
    .prepare(
      `UPDATE extractions SET 
       vendor_name = ?, date = ?, total = ?, currency = ?, is_reviewed = 1
       WHERE id = ?`,
    )
    .bind(
      data.vendor_name ?? null,
      data.date ?? null,
      data.total ?? null,
      data.currency ?? null,
      extractionId,
    )
    .run();

  await db
    .prepare(
      `UPDATE documents SET updated_at = ? WHERE id = (SELECT document_id FROM extractions WHERE id = ?)`,
    )
    .bind(now, extractionId)
    .run();
}
