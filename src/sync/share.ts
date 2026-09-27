import { parseShare } from '../domain/email';

export async function listenForShares(onCapture: (title: string, note: string) => void): Promise<() => void> {
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (!cap?.isNativePlatform?.()) return () => {};
  const { CapacitorShareTarget } = await import('@capgo/capacitor-share-target');
  const handle = await CapacitorShareTarget.addListener('shareReceived', (event) => {
    const parsed = parseShare({ title: event.title, texts: event.texts });
    onCapture(parsed.title, parsed.note);
  });
  return () => {
    void handle.remove();
  };
}
