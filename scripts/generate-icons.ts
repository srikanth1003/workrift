import { writeFileSync, mkdirSync } from "fs";

function createSvgIcon(size: number): string {
  const r = Math.floor(size * 0.15);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#6366f1"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="system-ui" font-weight="bold" font-size="${size * 0.45}">W</text>
</svg>`;
}

mkdirSync("src/assets", { recursive: true });

for (const size of [16, 48, 128]) {
  writeFileSync(`src/assets/icon-${size}.svg`, createSvgIcon(size));
  console.log(`Created icon-${size}.svg`);
}
