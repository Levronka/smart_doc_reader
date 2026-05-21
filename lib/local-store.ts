export interface LocalDocumentRow {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LocalExtractionRow {
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

export interface LocalLineItemRow {
  id: string;
  extraction_id: string;
  name: string | null;
  quantity: number | null;
  unit_price: number | null;
  subtotal: number | null;
  conf: number | null;
}

export interface LocalFileObject {
  body: Uint8Array;
  contentType: string;
}

export interface LocalStore {
  documents: Map<string, LocalDocumentRow>;
  extractions: Map<string, LocalExtractionRow>;
  lineItems: Map<string, LocalLineItemRow[]>;
  files: Map<string, LocalFileObject>;
}

declare global {
  // eslint-disable-next-line no-var
  var __smartDocReaderLocalStore__: LocalStore | undefined;
}

export function getLocalStore(): LocalStore {
  if (!globalThis.__smartDocReaderLocalStore__) {
    globalThis.__smartDocReaderLocalStore__ = {
      documents: new Map(),
      extractions: new Map(),
      lineItems: new Map(),
      files: new Map(),
    };
  }

  return globalThis.__smartDocReaderLocalStore__;
}
