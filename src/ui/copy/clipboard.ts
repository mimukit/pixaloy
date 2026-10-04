/**
 * Write `text` to the clipboard from a click in the panel. Resolves false when
 * the page blocks it (a `Permissions-Policy` without `clipboard-write`, an
 * insecure origin with no `navigator.clipboard`, or a lost user activation).
 */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
