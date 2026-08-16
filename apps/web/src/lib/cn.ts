type ClassValue = string | false | null | undefined;

/** Fügt Klassennamen zusammen und lässt leere Werte weg. */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
