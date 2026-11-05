// Gera os ícones do PWA a partir do logo oficial (public/logo.png.jpeg).
// Uso: node scripts/generate-icons.mjs
// Usa o "sharp", que já vem instalado com o Next.js (nenhuma dependência nova).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SOURCE = "public/logo.png.jpeg";
const OUT_DIR = "public/icons";
const BACKGROUND = { r: 255, g: 255, b: 255 };
// O fundo do JPEG não é uniforme (escurece perto das bordas). Tons quase brancos viram
// branco puro, para o desenho não ficar dentro de um "retângulo" visível no ícone.
const NEAR_WHITE = 232;

// [arquivo, lado do ícone, fração do lado ocupada pelo maior lado do desenho]
// O maskable usa um desenho menor: tudo precisa caber no círculo seguro (80% do lado),
// porque o Android pode recortar o ícone em círculo, gota ou quadrado arredondado.
const TARGETS = [
  ["icon-192.png", 192, 0.86],
  ["icon-512.png", 512, 0.86],
  ["icon-maskable-512.png", 512, 0.56],
  ["apple-touch-icon.png", 180, 0.8],
];

// Recorta só o conteúdo do logo (sem a borda off-white), para centralizar num quadrado.
const trimmed = await sharp(SOURCE).trim({ threshold: 25 }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const px = trimmed.data;
for (let i = 0; i < px.length; i += trimmed.info.channels) {
  if (Math.min(px[i], px[i + 1], px[i + 2]) > NEAR_WHITE) px[i] = px[i + 1] = px[i + 2] = 255;
}
const content = await sharp(px, { raw: trimmed.info }).png().toBuffer();

await mkdir(OUT_DIR, { recursive: true });

for (const [file, size, fraction] of TARGETS) {
  const box = Math.round(size * fraction);
  const art = await sharp(content)
    .resize(box, box, { fit: "inside", kernel: "lanczos3" }) // só reduz: o logo tem 680 px
    .toBuffer();

  await sharp({ create: { width: size, height: size, channels: 3, background: BACKGROUND } })
    .composite([{ input: art, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(`${OUT_DIR}/${file}`);

  console.log(`${OUT_DIR}/${file} (${size}x${size})`);
}
