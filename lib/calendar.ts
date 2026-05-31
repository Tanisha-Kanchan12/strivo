function formatIcsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export function generateIcsContent(params: {
  title: string;
  description: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
}): string {
  const uid = `${Date.now()}@strivo.app`;
  const now = formatIcsDate(new Date());
  const dtStart = formatIcsDate(params.start);
  const dtEnd = formatIcsDate(params.end);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Strivo//Study Session//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${params.title.replace(/,/g, "\\,")}`,
    `DESCRIPTION:${params.description.replace(/\n/g, "\\n").replace(/,/g, "\\,")}`,
  ];

  if (params.location) {
    lines.push(`LOCATION:${params.location.replace(/,/g, "\\,")}`);
  }
  if (params.url) {
    lines.push(`URL:${params.url}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}
