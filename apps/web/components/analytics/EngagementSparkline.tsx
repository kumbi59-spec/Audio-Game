"use client";

interface EngagementSparklineProps {
  days: string[];
  sessionsStarted: number[];
  playerTurns: number[];
  worldName: string;
}

const WIDTH = 320;
const HEIGHT = 64;
const PAD_X = 4;
const PAD_Y = 6;

function buildPath(values: number[], max: number): string {
  if (values.length === 0 || max === 0) {
    return `M ${PAD_X} ${HEIGHT - PAD_Y} L ${WIDTH - PAD_X} ${HEIGHT - PAD_Y}`;
  }
  const usableW = WIDTH - PAD_X * 2;
  const usableH = HEIGHT - PAD_Y * 2;
  const stepX = values.length > 1 ? usableW / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = PAD_X + i * stepX;
      const y = PAD_Y + (1 - v / max) * usableH;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function summarize(label: string, values: number[]): string {
  const total = values.reduce((a, b) => a + b, 0);
  const peak = values.reduce((m, v) => Math.max(m, v), 0);
  const peakIndex = values.indexOf(peak);
  return `${total} ${label} total; peak of ${peak} on day ${peakIndex + 1} of ${values.length}.`;
}

export function EngagementSparkline({
  days,
  sessionsStarted,
  playerTurns,
  worldName,
}: EngagementSparklineProps) {
  const maxSessions = Math.max(1, ...sessionsStarted);
  const maxTurns = Math.max(1, ...playerTurns);

  const sessionsPath = buildPath(sessionsStarted, maxSessions);
  const turnsPath = buildPath(playerTurns, maxTurns);

  const summary = `${worldName} engagement, ${days.length} days. ${summarize("sessions", sessionsStarted)} ${summarize("player turns", playerTurns)}`;

  return (
    <figure className="mb-4" aria-label={`Engagement trend for ${worldName}`}>
      <svg
        role="img"
        aria-label={summary}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="block w-full"
        style={{
          height: HEIGHT,
          backgroundColor: "var(--surface-2, var(--surface))",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
        }}
      >
        <path
          d={turnsPath}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth={1.5}
          strokeOpacity={0.6}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d={sessionsPath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <figcaption
        className="mt-1 flex items-center justify-between text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <span aria-hidden="true">
          <span style={{ color: "var(--accent)" }}>━</span> sessions started
          {" · "}
          <span>━</span> player turns
        </span>
        <span>
          {days[0]?.slice(5)} → {days[days.length - 1]?.slice(5)}
        </span>
      </figcaption>
      <table className="sr-only" aria-label={`Daily engagement for ${worldName}`}>
        <thead>
          <tr><th>Date</th><th>Sessions started</th><th>Player turns</th></tr>
        </thead>
        <tbody>
          {days.map((d, i) => (
            <tr key={d}>
              <td>{d}</td>
              <td>{sessionsStarted[i] ?? 0}</td>
              <td>{playerTurns[i] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
