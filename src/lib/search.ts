/**
 * Ékezet- és kisbetű-független keresés. Szándékosan kézi leképezéssel (nem
 * `String.normalize`-zal), hogy a Hermes motoron is garantáltan működjön:
 * így a „gugolas" is megtalálja a „Guggolás"-t.
 */

const ACCENTS: Record<string, string> = {
  á: 'a',
  é: 'e',
  í: 'i',
  ó: 'o',
  ö: 'o',
  ő: 'o',
  ú: 'u',
  ü: 'u',
  ű: 'u',
};

export function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .split('')
    .map((char) => ACCENTS[char] ?? char)
    .join('');
}

/** Igaz, ha a keresőkifejezés minden szava szerepel a szövegben. */
export function matchesSearch(haystack: string, needle: string): boolean {
  const query = normalizeForSearch(needle).trim();
  if (query === '') return true;

  const target = normalizeForSearch(haystack);
  return query.split(/\s+/).every((word) => target.includes(word));
}
