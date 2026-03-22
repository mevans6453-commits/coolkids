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

  // Strip HTML tags: convert <br>, <br/>, and block-level closing tags to a space, then remove all remaining tags
  let decoded = text.replace(/<br\s*\/?>/gi, " ");
  decoded = decoded.replace(/<\/(?:p|div|li|h[1-6]|tr|blockquote)>/gi, " ");
  decoded = decoded.replace(/<[^>]+>/g, "");

  // Decode numeric entities: &#8220; or &#x201C;
  decoded = decoded.replace(/&#(\d+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 10))
  );
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
    String.fromCharCode(parseInt(code, 16))
  );

  // Decode named entities
  decoded = decoded.replace(/&[a-zA-Z]+;/g, (entity) =>
    NAMED_ENTITIES[entity.toLowerCase()] ?? entity
  );

  // Collapse extra whitespace (from removed tags) into single spaces and trim
  decoded = decoded.replace(/\s+/g, " ").trim();

  return decoded;
}
