/*
 * Kurz-Vorschau einer Notiz für Tooltips: Frontmatter weg, Leerzeilen
 * zusammengezogen, auf wenige Zeilen/Zeichen gekürzt. Reiner Text, kein
 * Markdown-Rendering – bewusst schlicht, damit das Hovern schnell bleibt.
 */
export function excerptFromMarkdown(text: string, maxChars = 280, maxLines = 6): string {
  let body = text ?? "";
  // Frontmatter am Dateianfang entfernen
  const fm = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/.exec(body);
  if (fm) body = body.slice(fm[0].length);
  const lines = body
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    // Überschriften-Rauten und Kommentare entfernen, Rest unverändert
    .map((l) => l.replace(/^#{1,6}\s+/, ""))
    .filter((l) => !/^<!--.*-->$/.test(l.trim()));
  // Mehrfache Leerzeilen zu einer, führende/abschließende Leerzeilen weg
  const compact: string[] = [];
  for (const l of lines) {
    if (!l.trim() && (!compact.length || !compact[compact.length - 1].trim())) continue;
    compact.push(l);
  }
  while (compact.length && !compact[compact.length - 1].trim()) compact.pop();

  let cut = compact.length > maxLines;
  let out = compact.slice(0, maxLines).join("\n");
  if (out.length > maxChars) {
    out = out.slice(0, maxChars).replace(/\s+\S*$/, "");
    cut = true;
  }
  return cut ? out + " …" : out;
}
