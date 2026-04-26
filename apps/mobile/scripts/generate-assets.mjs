/**
 * Generates placeholder app icons, splash screen, and App Store screenshots.
 *
 * Usage:
 *   node scripts/generate-assets.mjs
 *
 * Prerequisites (install once):
 *   npm install -g sharp-cli
 *   # or: pnpm add -D sharp canvas
 *
 * For production: replace assets/icon.svg + assets/splash.svg with real artwork
 * then re-run this script. All PNGs are derived from the SVG sources.
 *
 * Required output sizes:
 *   iOS App Store icon       1024×1024  assets/icon.png
 *   Android adaptive icon    1024×1024  assets/adaptive-icon.png
 *   Expo splash (all)        1284×2778  assets/splash.png
 *
 * Screenshot sizes (App Store Connect requires at least one device per set):
 *   iPhone 6.7"   1290×2796  (iPhone 15 Pro Max)
 *   iPhone 6.5"   1242×2688  (iPhone 11 Pro Max / Xs Max)
 *   iPhone 5.5"   1242×2208  (iPhone 8 Plus)
 *   iPad Pro 13"  2064×2752
 *   Android phone 1080×1920
 */

import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

mkdirSync(join(ROOT, "assets"), { recursive: true });
mkdirSync(join(ROOT, "../../store/screenshots/ios"), { recursive: true });
mkdirSync(join(ROOT, "../../store/screenshots/android"), { recursive: true });

const ACCENT = "#7c3aed";
const BG = "#0d0d0d";
const TEXT = "#ffffff";

function drawIcon(canvas) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  // Background gradient
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
  grad.addColorStop(0, "#1a0a2e");
  grad.addColorStop(1, BG);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Rounded rect clip (iOS-style icon rounding handled by OS, but looks nice)
  const r = w * 0.2;
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, r);
  ctx.clip();
  ctx.fillRect(0, 0, w, h);

  // Glowing circle
  const glow = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.32);
  glow.addColorStop(0, ACCENT + "cc");
  glow.addColorStop(1, ACCENT + "00");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(w / 2, h * 0.45, w * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Sound wave arcs (audio symbol)
  ctx.strokeStyle = TEXT;
  ctx.lineWidth = w * 0.035;
  ctx.lineCap = "round";
  const cx = w / 2;
  const cy = h * 0.45;
  for (let i = 1; i <= 3; i++) {
    const rad = w * 0.1 * i;
    ctx.globalAlpha = 1 - i * 0.2;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, Math.PI * 0.6, Math.PI * 2.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, rad, -(Math.PI * 0.4), Math.PI * 0.4 - Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // "EQ" text mark
  ctx.fillStyle = TEXT;
  ctx.font = `bold ${w * 0.14}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EQ", cx, cy);

  // App name at bottom
  ctx.font = `${w * 0.07}px system-ui`;
  ctx.fillStyle = "#aaaaaa";
  ctx.fillText("EchoQuest", cx, h * 0.82);
}

function drawSplash(canvas) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // Centered glow
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.55);
  glow.addColorStop(0, ACCENT + "44");
  glow.addColorStop(1, ACCENT + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Logo circle
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = w * 0.012;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, w * 0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.fillStyle = TEXT;
  ctx.font = `bold ${w * 0.09}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EQ", w / 2, h / 2);

  ctx.font = `${w * 0.055}px system-ui`;
  ctx.fillStyle = ACCENT;
  ctx.fillText("EchoQuest", w / 2, h / 2 + w * 0.2);

  ctx.font = `${w * 0.03}px system-ui`;
  ctx.fillStyle = "#666666";
  ctx.fillText("Audio-first interactive storytelling", w / 2, h / 2 + w * 0.33);
}

function drawScreenshot(canvas, screen) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);

  // Header bar
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, w, h * 0.08);

  ctx.fillStyle = "#333333";
  ctx.fillRect(0, h * 0.08, w, 1);

  ctx.fillStyle = TEXT;
  ctx.font = `bold ${w * 0.04}px system-ui`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(screen.title, w / 2, h * 0.04);

  // Content area mockup
  ctx.fillStyle = "#1a1a1a";
  const pad = w * 0.05;
  const cardH = h * 0.12;
  for (let i = 0; i < screen.cards; i++) {
    const y = h * 0.12 + i * (cardH + pad);
    ctx.fillRect(pad, y, w - pad * 2, cardH);
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(pad * 1.5, y + cardH * 0.2, w * 0.5, cardH * 0.25);
    ctx.fillRect(pad * 1.5, y + cardH * 0.55, w * 0.35, cardH * 0.18);
    ctx.fillStyle = "#1a1a1a";
  }

  // Caption
  ctx.fillStyle = "#888888";
  ctx.font = `${w * 0.028}px system-ui`;
  ctx.textAlign = "center";
  ctx.fillText(screen.caption, w / 2, h * 0.93);
}

const SCREENS = [
  { title: "Adventure Library", cards: 4, caption: "Choose from official and community worlds" },
  { title: "Game in Progress", cards: 3, caption: "AI Game Master narrates your adventure" },
  { title: "My Worlds", cards: 2, caption: "Publish your worlds to the community" },
];

// Generate icon
const iconCanvas = createCanvas(1024, 1024);
drawIcon(iconCanvas);
writeFileSync(join(ROOT, "assets/icon.png"), iconCanvas.toBuffer("image/png"));
writeFileSync(join(ROOT, "assets/adaptive-icon.png"), iconCanvas.toBuffer("image/png"));
console.log("✓ assets/icon.png");
console.log("✓ assets/adaptive-icon.png");

// Generate splash
const splashCanvas = createCanvas(1284, 2778);
drawSplash(splashCanvas);
writeFileSync(join(ROOT, "assets/splash.png"), splashCanvas.toBuffer("image/png"));
console.log("✓ assets/splash.png");

// iPhone 6.7" screenshots
const iphone67 = { w: 1290, h: 2796 };
SCREENS.forEach((screen, i) => {
  const c = createCanvas(iphone67.w, iphone67.h);
  drawScreenshot(c, screen);
  const out = join(ROOT, `../../store/screenshots/ios/iphone67-${i + 1}.png`);
  writeFileSync(out, c.toBuffer("image/png"));
  console.log(`✓ store/screenshots/ios/iphone67-${i + 1}.png`);
});

// iPhone 6.5" screenshots
const iphone65 = { w: 1242, h: 2688 };
SCREENS.forEach((screen, i) => {
  const c = createCanvas(iphone65.w, iphone65.h);
  drawScreenshot(c, screen);
  const out = join(ROOT, `../../store/screenshots/ios/iphone65-${i + 1}.png`);
  writeFileSync(out, c.toBuffer("image/png"));
  console.log(`✓ store/screenshots/ios/iphone65-${i + 1}.png`);
});

// Android phone screenshots
const android = { w: 1080, h: 1920 };
SCREENS.forEach((screen, i) => {
  const c = createCanvas(android.w, android.h);
  drawScreenshot(c, screen);
  const out = join(ROOT, `../../store/screenshots/android/phone-${i + 1}.png`);
  writeFileSync(out, c.toBuffer("image/png"));
  console.log(`✓ store/screenshots/android/phone-${i + 1}.png`);
});

console.log("\nAll assets generated. Replace with final artwork before submission.");
