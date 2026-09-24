// Entry bodies are stored as HTML from the rich-text editor. Entries written
// before it existed are plain text, so everything reading a body goes through
// these helpers instead of assuming one format.

const HTML_BODY = /^\s*<(p|h[1-6]|ul|ol|table|blockquote|pre|div|hr)[\s>/]/i;

export function isHtmlBody(body: string) {
  return HTML_BODY.test(body);
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Plain text -> one paragraph per line, for the editor. */
export function textToHtml(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => (line ? `<p>${escapeHtml(line)}</p>` : "<p></p>"))
    .join("");
}

/** Any stored body (HTML or legacy plain text) -> editor content. */
export function bodyToHtml(body: string) {
  return isHtmlBody(body) ? body : textToHtml(body);
}

/** Any stored body -> readable plain text for previews, search, counts and AI. */
export function bodyToText(body: string) {
  if (!isHtmlBody(body)) return body;
  return body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|tr|blockquote|pre|div)>/gi, "\n")
    .replace(/<\/t[dh]>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
