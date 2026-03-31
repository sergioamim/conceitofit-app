import DOMPurify from "dompurify";

/**
 * Sanitiza HTML usando DOMPurify, removendo scripts e atributos perigosos.
 * Permite apenas tags de formatação seguras (texto, tabelas, listas).
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      "p", "br", "b", "strong", "i", "em", "u", "s", "small",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "hr",
    ],
    ALLOWED_ATTR: ["class", "style"],
  });
}
