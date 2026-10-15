// Renders chosen PDF pages to PNG for visual checks: node pdf2png.mjs file.pdf widthPx page[,page]
import fs from "node:fs";
import { createCanvas, Path2D, DOMMatrix, ImageData } from "@napi-rs/canvas";
Object.assign(globalThis, { Path2D, DOMMatrix, ImageData });
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const [file, width = "1400", pages = "1"] = process.argv.slice(2);
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), standardFontDataUrl: "node_modules/pdfjs-dist/standard_fonts/" }).promise;
for (const n of pages.split(",").map(Number)) {
  const page = await doc.getPage(n);
  const vp1 = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: Number(width) / vp1.width });
  const canvas = createCanvas(Math.round(vp.width), Math.round(vp.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  const out = file.replace(/\.pdf$/, `-p${n}.png`);
  fs.writeFileSync(out, canvas.toBuffer("image/png"));
  console.log(out, doc.numPages, "pages");
}
