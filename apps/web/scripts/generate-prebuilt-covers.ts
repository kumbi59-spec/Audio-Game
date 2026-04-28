import { generateWorldCoverSVG } from "../lib/worlds/cover-art";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const worlds = [
  { id: "neon-precinct", name: "Neon Precinct", genre: "cyberpunk", tone: "noir" },
  { id: "long-watch", name: "The Long Watch", genre: "sci-fi", tone: "tense" },
  { id: "black-vellum", name: "The Black Vellum", genre: "horror", tone: "dread" },
  { id: "saltbound", name: "Saltbound", genre: "adventure", tone: "swashbuckling" },
];

const outDir = resolve(__dirname, "..", "public", "images", "worlds");

for (const w of worlds) {
  const svg = generateWorldCoverSVG(w.name, w.genre, w.tone);
  const out = resolve(outDir, `${w.id}.svg`);
  writeFileSync(out, svg);
  console.log(`wrote ${out}`);
}
