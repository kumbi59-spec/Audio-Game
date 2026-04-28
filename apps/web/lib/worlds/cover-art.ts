// Generates an SVG cover image for a world based on its genre and name.
// The resulting SVG string can be stored as a data URL in world.imageUrl.

interface Palette {
  bg1: string;
  bg2: string;
  accent1: string;
  accent2: string;
  label: string;
  genreLabel: string;
  shapes: "shards" | "organic" | "geometric" | "industrial" | "dunes" | "stars" | "arcs";
}

const GENRE_PALETTES: Record<string, Palette> = {
  "dark-fantasy":   { bg1: "#0d0118", bg2: "#1e0640", accent1: "#7c2fbf", accent2: "#c9a227", label: "#9060c0", genreLabel: "DARK FANTASY", shapes: "shards" },
  "fantasy":        { bg1: "#0a0c28", bg2: "#101840", accent1: "#4060c0", accent2: "#c0a840", label: "#8090e0", genreLabel: "FANTASY",      shapes: "stars"  },
  "gothic":         { bg1: "#040c04", bg2: "#0a180a", accent1: "#3a6e20", accent2: "#8a9060", label: "#4e8e40", genreLabel: "GOTHIC",        shapes: "organic"},
  "horror":         { bg1: "#100404", bg2: "#200808", accent1: "#881010", accent2: "#802020", label: "#c04040", genreLabel: "HORROR",        shapes: "organic"},
  "sci-fi":         { bg1: "#020810", bg2: "#041420", accent1: "#0880c0", accent2: "#00c0e0", label: "#40b0f0", genreLabel: "SCI-FI",        shapes: "geometric"},
  "steampunk":      { bg1: "#0d0e10", bg2: "#1a1c20", accent1: "#8b5a2b", accent2: "#cc7700", label: "#b07030", genreLabel: "STEAMPUNK",     shapes: "industrial"},
  "desert":         { bg1: "#1a0808", bg2: "#5c1a0a", accent1: "#d08040", accent2: "#c87040", label: "#d08040", genreLabel: "DESERT",        shapes: "dunes"  },
  "adventure":      { bg1: "#0a1a04", bg2: "#183008", accent1: "#3a9020", accent2: "#e8a030", label: "#60b040", genreLabel: "ADVENTURE",     shapes: "arcs"   },
  "mystery":        { bg1: "#080818", bg2: "#101030", accent1: "#6040a0", accent2: "#a08060", label: "#8060c0", genreLabel: "MYSTERY",       shapes: "arcs"   },
  "thriller":       { bg1: "#060810", bg2: "#0e1220", accent1: "#204060", accent2: "#406080", label: "#4080a0", genreLabel: "THRILLER",      shapes: "geometric"},
  "historical":     { bg1: "#100c04", bg2: "#201808", accent1: "#806030", accent2: "#c0a060", label: "#b09050", genreLabel: "HISTORICAL",    shapes: "arcs"   },
  "nature":         { bg1: "#041008", bg2: "#0a2010", accent1: "#3a8028", accent2: "#e8a030", label: "#60a840", genreLabel: "NATURE",        shapes: "organic"},
};

function getPalette(genre: string): Palette {
  const key = genre.toLowerCase().replace(/[^a-z-]/g, "-");
  for (const [k, v] of Object.entries(GENRE_PALETTES)) {
    if (key.includes(k)) return v;
  }
  // Default: dark fantasy feel
  return GENRE_PALETTES["dark-fantasy"]!;
}

function shapesSVG(palette: Palette, name: string): string {
  const { accent1, accent2 } = palette;

  switch (palette.shapes) {
    case "shards":
      return `
        <polygon points="180,195 250,145 330,158 360,205 320,232 200,228" fill="${accent1}" opacity="0.7"/>
        <polygon points="60,175 110,148 155,162 160,188 125,202 70,198" fill="${accent1}" opacity="0.55"/>
        <polygon points="400,162 460,138 510,152 515,180 470,195 408,188" fill="${accent1}" opacity="0.5"/>
        <polygon points="145,102 168,88 195,95 196,112 174,118 147,112" fill="${accent1}" opacity="0.4"/>
        <polygon points="390,95 415,82 438,90 436,108 412,114 392,107" fill="${accent1}" opacity="0.38"/>
        <circle cx="245" cy="172" r="3" fill="${accent2}" opacity="0.9"/>
        <circle cx="310" cy="160" r="2.5" fill="${accent2}" opacity="0.8"/>
        <circle cx="120" cy="165" r="2" fill="${accent2}" opacity="0.7"/>
        <ellipse cx="300" cy="290" rx="250" ry="55" fill="${accent1}" opacity="0.18"/>`;

    case "organic":
      return `
        <path d="M60,220 Q100,180 130,200 Q160,220 140,250 Q120,280 80,265 Q40,250 60,220Z" fill="${accent1}" opacity="0.45"/>
        <path d="M440,200 Q490,165 530,185 Q570,205 555,240 Q540,275 500,268 Q460,260 440,200Z" fill="${accent1}" opacity="0.4"/>
        <path d="M230,150 Q270,120 310,140 Q350,160 340,195 Q330,230 290,225 Q250,220 230,150Z" fill="${accent1}" opacity="0.5"/>
        <circle cx="295" cy="175" r="18" fill="${accent1}" opacity="0.25"/>
        <ellipse cx="300" cy="280" rx="280" ry="50" fill="${accent1}" opacity="0.2"/>
        <circle cx="180" cy="205" r="4" fill="${accent2}" opacity="0.6"/>
        <circle cx="420" cy="215" r="3.5" fill="${accent2}" opacity="0.55"/>
        <circle cx="300" cy="165" r="3" fill="${accent2}" opacity="0.5"/>`;

    case "geometric":
      return `
        <polygon points="300,100 400,200 300,200" fill="${accent1}" opacity="0.5"/>
        <polygon points="300,100 200,200 300,200" fill="${accent1}" opacity="0.4"/>
        <polygon points="150,200 250,280 150,280" fill="${accent1}" opacity="0.4"/>
        <polygon points="450,200 350,280 450,280" fill="${accent1}" opacity="0.38"/>
        <rect x="260" y="180" width="80" height="80" fill="${accent1}" opacity="0.25" transform="rotate(15,300,220)"/>
        <circle cx="300" cy="150" r="5" fill="${accent2}" opacity="0.8"/>
        <circle cx="200" cy="240" r="4" fill="${accent2}" opacity="0.6"/>
        <circle cx="400" cy="240" r="4" fill="${accent2}" opacity="0.6"/>
        <line x1="300" y1="100" x2="200" y2="280" stroke="${accent2}" stroke-width="1" opacity="0.2"/>
        <line x1="300" y1="100" x2="400" y2="280" stroke="${accent2}" stroke-width="1" opacity="0.2"/>`;

    case "industrial":
      return `
        <rect x="160" y="160" width="280" height="120" fill="${accent1}" opacity="0.5"/>
        <polygon points="160,160 300,110 440,160" fill="${accent1}" opacity="0.45"/>
        <rect x="120" y="185" width="50" height="95" fill="${accent1}" opacity="0.4"/>
        <rect x="430" y="185" width="50" height="95" fill="${accent1}" opacity="0.4"/>
        <circle cx="300" cy="195" r="30" fill="none" stroke="${accent2}" stroke-width="7" opacity="0.55"/>
        <circle cx="300" cy="195" r="18" fill="${accent1}" opacity="0.6"/>
        <rect x="295" y="165" width="10" height="60" fill="${accent2}" opacity="0.4"/>
        <rect x="270" y="190" width="60" height="10" fill="${accent2}" opacity="0.4"/>
        <rect x="160" y="278" width="280" height="6" fill="${accent2}" opacity="0.3"/>`;

    case "dunes":
      return `
        <ellipse cx="150" cy="270" rx="220" ry="80" fill="${accent1}" opacity="0.65"/>
        <ellipse cx="450" cy="265" rx="220" ry="75" fill="${accent1}" opacity="0.6"/>
        <ellipse cx="300" cy="285" rx="310" ry="70" fill="${accent1}" opacity="0.55"/>
        <circle cx="450" cy="145" r="45" fill="${accent2}" opacity="0.6"/>
        <circle cx="450" cy="145" r="30" fill="${accent2}" opacity="0.5"/>
        <polygon points="155,210 185,165 215,210" fill="${accent1}" opacity="0.45"/>
        <polygon points="380,215 415,162 448,215" fill="${accent1}" opacity="0.4"/>
        <ellipse cx="300" cy="250" rx="310" ry="30" fill="${accent2}" opacity="0.08"/>`;

    case "stars":
      return `
        <g fill="${accent2}" opacity="0.7">
          ${Array.from({length: 20}, (_, i) => {
            const x = 40 + (i * 29) % 520;
            const y = 30 + (i * 37 + i * i * 3) % 240;
            const r = 0.8 + (i % 3) * 0.7;
            return `<circle cx="${x}" cy="${y}" r="${r}"/>`;
          }).join("")}
        </g>
        <polygon points="300,120 330,200 410,200 348,248 372,328 300,280 228,328 252,248 190,200 270,200" fill="${accent1}" opacity="0.5"/>
        <circle cx="300" cy="220" r="35" fill="${accent1}" opacity="0.4"/>
        <ellipse cx="300" cy="285" rx="240" ry="45" fill="${accent1}" opacity="0.2"/>`;

    case "arcs":
    default:
      return `
        <path d="M80,280 Q300,100 520,280" stroke="${accent1}" stroke-width="40" fill="none" opacity="0.45" stroke-linecap="round"/>
        <path d="M120,290 Q300,130 480,290" stroke="${accent1}" stroke-width="25" fill="none" opacity="0.35" stroke-linecap="round"/>
        <path d="M160,295 Q300,160 440,295" stroke="${accent1}" stroke-width="14" fill="none" opacity="0.3" stroke-linecap="round"/>
        <circle cx="300" cy="180" r="8" fill="${accent2}" opacity="0.75"/>
        <circle cx="300" cy="180" r="4" fill="${accent2}" opacity="0.9"/>
        <ellipse cx="300" cy="290" rx="260" ry="40" fill="${accent1}" opacity="0.2"/>`;
  }
}

export function generateWorldCoverSVG(name: string, genre: string, tone = ""): string {
  const palette = getPalette(genre);
  const { bg1, bg2, label, genreLabel } = palette;

  // Truncate name for display
  const displayName = name.length > 24 ? name.slice(0, 22) + "…" : name;
  const toneLabel = tone.slice(0, 28).toUpperCase();

  const shapes = shapesSVG(palette, name);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360">
  <defs>
    <linearGradient id="cg-bg" x1="0%" y1="0%" x2="30%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <filter id="cg-glow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="600" height="360" fill="url(#cg-bg)"/>
  ${shapes}
  <rect x="0" y="320" width="600" height="40" fill="${bg1}" opacity="0.82"/>
  <text x="20" y="344" font-family="Georgia, serif" font-size="13" fill="${label}" opacity="0.9" letter-spacing="3">${genreLabel}</text>
  ${toneLabel ? `<text x="580" y="344" font-family="Georgia, serif" font-size="11" fill="${palette.accent2}" opacity="0.75" text-anchor="end" letter-spacing="1">${toneLabel}</text>` : ""}
</svg>`;
}

export function worldCoverDataUrl(name: string, genre: string, tone?: string): string {
  const svg = generateWorldCoverSVG(name, genre, tone);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
