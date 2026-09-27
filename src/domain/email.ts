export function parseEmail(raw: string): { title: string; note: string } {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const title = (lines[0] ?? '').trim() || 'Email';
  const note = lines.slice(1).join('\n').trim();
  return { title, note };
}

export function parseShare(input: { title?: string | null; texts?: string[] | null }): { title: string; note: string } {
  const texts = (input.texts ?? []).map((line) => line.trim()).filter(Boolean);
  const sharedTitle = (input.title ?? '').trim();
  if (sharedTitle && texts.length === 0) return { title: sharedTitle, note: '' };
  if (sharedTitle && texts.length > 0) {
    const body = texts.join('\n').trim();
    if (body.startsWith(sharedTitle)) return parseEmail(body);
    return { title: sharedTitle, note: body };
  }
  return parseEmail(texts.join('\n'));
}
