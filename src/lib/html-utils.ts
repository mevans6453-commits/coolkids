/**
 * Decode HTML entities in a string.
 * Handles named entities (&amp; &lt; etc.) and numeric entities (&#8220; &#x2014; etc.)
 */
const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&nbsp;": " ",
  "&ndash;": "–",
  "&mdash;": "—",
  "&lsquo;": "\u2018",
  "&rsquo;": "\u2019",
  "&ldquo;": "\u201C",
  "&rdquo;": "\u201D",
  "&hellip;": "…",
  "&bull;": "•",
  "&copy;": "©",
  "&reg;": "®",
  "&trade;": "™",
};

export function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  // Decode numeric entities: &#8220; or &#x201C;
  let decoded = text.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

  // Decode named entities
  decoded = decoded.replace(/&[a-zA-Z]+;/g, (entity) =>
    NAMED_ENTITIES[entity.toLowerCase()] ?? entity
  );

  return decoded;
}
