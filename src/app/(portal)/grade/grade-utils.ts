import type { GradeCardItem } from "./grade-week-card";

export type CardPlacement = { item: GradeCardItem; track: number; trackCount: number };

export function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function toMinutes(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

/** Posiciona cards sobrepostos em "tracks" (colunas) lado a lado dentro de um dia. */
export function assignTracks(items: GradeCardItem[]): CardPlacement[] {
  if (items.length === 0) return [];
  const sorted = [...items].sort((a, b) => a.inicioMin - b.inicioMin || a.fimMin - b.fimMin);
  const trackEnds: number[] = [];
  const placement: { item: GradeCardItem; track: number }[] = [];

  for (const item of sorted) {
    let track = trackEnds.findIndex((end) => end <= item.inicioMin);
    if (track === -1) {
      trackEnds.push(item.fimMin);
      track = trackEnds.length - 1;
    } else {
      trackEnds[track] = item.fimMin;
    }
    placement.push({ item, track });
  }

  const trackCount = trackEnds.length;
  return placement.map((p) => ({ ...p, trackCount }));
}
