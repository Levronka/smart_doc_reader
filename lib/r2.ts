import { getLocalStore } from "./local-store";

export async function uploadToR2(
  bucket: R2Bucket | null | undefined,
  key: string,
  file: ArrayBuffer,
  contentType: string,
) {
  if (!bucket) {
    getLocalStore().files.set(key, {
      body: new Uint8Array(file),
      contentType,
    });

    return key;
  }

  await bucket.put(key, file, {
    httpMetadata: { contentType },
  });

  return key;
}

export async function getFromR2(
  bucket: R2Bucket | null | undefined,
  key: string,
) {
  if (!bucket) {
    const file = getLocalStore().files.get(key);
    if (!file) return null;

    return {
      body: file.body,
      httpMetadata: { contentType: file.contentType },
    };
  }

  return bucket.get(key);
}

export async function deleteFromR2(
  bucket: R2Bucket | null | undefined,
  key: string,
) {
  if (!bucket) {
    getLocalStore().files.delete(key);
    return;
  }

  await bucket.delete(key);
}
