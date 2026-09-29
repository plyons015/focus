import { Capacitor } from '@capacitor/core';
import { copy } from '../domain/copy';
import type { CachedEvent, ProviderLink } from '../domain/types';

export function parseZohoTime(value: string | undefined): string | null {
  if (!value) return null;
  const timed = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z|[+-]\d{4})?$/.exec(value);
  if (timed) {
    const [, year, month, day, hour, minute, second, zone] = timed;
    const local = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    if (!zone || zone === 'Z') return new Date(local).toISOString();
    const sign = zone.startsWith('-') ? -1 : 1;
    const offset = (Number(zone.slice(1, 3)) * 60 + Number(zone.slice(3, 5))) * 60 * 1000;
    return new Date(local - sign * offset).toISOString();
  }
  const allDay = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (allDay) return `${allDay[1]}-${allDay[2]}-${allDay[3]}T19:00:00.000Z`;
  return null;
}

export function zohoReady(link: ProviderLink): boolean {
  return Boolean(link.clientId.trim() && link.clientSecret.trim() && link.refreshToken.trim() && link.writeCalendarId.trim());
}

export function calendarBase(accountsUrl: string): string {
  try {
    const host = new URL(accountsUrl).host.replace(/^accounts\./, '');
    return `https://calendar.${host}`;
  } catch {
    return 'https://calendar.zoho.com';
  }
}

function dayStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** Zoho calendar ids are base64 and must keep their trailing equals signs. */
export function zohoCalendarPath(calendarId: string): string {
  return encodeURIComponent(calendarId).replace(/%3D/gi, '=');
}

export function replaceProviderEvents(existing: CachedEvent[], provider: CachedEvent['provider'], incoming: CachedEvent[]): CachedEvent[] {
  return [...existing.filter((event) => event.provider !== provider), ...incoming];
}

export async function pullZohoEvents(link: ProviderLink, ownerId: string, now = new Date()): Promise<{ events: CachedEvent[]; error: string | null }> {
  if (!link.clientId.trim() || !link.clientSecret.trim() || !link.refreshToken.trim()) {
    return { events: [], error: copy.zohoNeedsToken };
  }
  if (!link.writeCalendarId.trim()) {
    return { events: [], error: copy.zohoNeedsToken };
  }
  const accounts = (link.accountsUrl || 'https://accounts.zoho.com').replace(/\/$/, '');
  try {
    const body = new URLSearchParams({
      refresh_token: link.refreshToken.trim(),
      client_id: link.clientId.trim(),
      client_secret: link.clientSecret.trim(),
      grant_type: 'refresh_token',
    });
    const tokenResponse = await fetch(`${accounts}/oauth/v2/token?${body.toString()}`, { method: 'POST' });
    if (!tokenResponse.ok) return { events: [], error: copy.zohoSilent };
    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) return { events: [], error: copy.zohoSilent };
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const calendarId = link.writeCalendarId.trim();
    const listUrl = `${calendarBase(accounts)}/api/v1/calendars/${zohoCalendarPath(calendarId)}/events?start=${dayStamp(now)}&end=${dayStamp(end)}`;
    const listResponse = await fetch(listUrl, { headers: { Authorization: `Zoho-oauthtoken ${tokenJson.access_token}` } });
    if (!listResponse.ok) return { events: [], error: copy.zohoSilent };
    const listed = (await listResponse.json()) as { events?: Array<Record<string, unknown>> };
    const events = (listed.events ?? [])
      .map((event) => toCached(event, calendarId, ownerId, now))
      .filter((event): event is CachedEvent => event != null);
    return { events, error: null };
  } catch {
    if (!Capacitor.isNativePlatform()) return { events: [], error: copy.zohoBrowser };
    return { events: [], error: copy.zohoSilent };
  }
}

function toCached(event: Record<string, unknown>, calendarId: string, ownerId: string, now: Date): CachedEvent | null {
  const when = (event.dateandtime ?? {}) as { start?: string; end?: string };
  const eventId = String(event.uid ?? event.id ?? '');
  const start = parseZohoTime(when.start);
  if (!eventId || !start) return null;
  return {
    id: `zoho_${eventId}`,
    ownerId,
    provider: 'zoho',
    calendarId,
    eventId,
    title: String(event.title ?? 'Calendar'),
    start,
    end: parseZohoTime(when.end) ?? start,
    etag: String(event.etag ?? ''),
    ownedByZigzag: false,
    updatedAt: now.toISOString(),
  };
}
