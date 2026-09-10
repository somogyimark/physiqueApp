/**
 * Rövid, ütközésmentes azonosító drop-set csoportokhoz. Nem kriptográfiai —
 * elég, hogy egy edzésen belül egyedi legyen. Ha a futtatókörnyezet ismeri a
 * Web Crypto `randomUUID`-t (Hermes újabb verziók), azt használjuk.
 */
export function shortId(): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
