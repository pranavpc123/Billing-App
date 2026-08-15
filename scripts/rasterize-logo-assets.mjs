// One-off asset pipeline: rasterizes the DELSORA brand PDFs into PNGs for /public,
// and samples brand colors from the rendered logo mark. Re-run if source PDFs change.
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
fs.mkdirSync(publicDir, { recursive: true });

const DOWNLOADS = "C:\\Users\\Prana\\Downloads";
const LOGO_MARK_PDF = path.join(DOWNLOADS, "D&S LOGO-Final.pdf");
const BUSINESS_CARD_PDF = path.join(DOWNLOADS, "Delsora Business card 2.pdf");

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

async function renderPdfPageToPng(pdfPath, pageNumber, outPath, scale) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({ data }).promise;
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvasFactory = new NodeCanvasFactory();
  const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

  await page.render({
    canvasContext: canvasAndContext.context,
    viewport,
    canvasFactory,
  }).promise;

  const buffer = canvasAndContext.canvas.toBuffer("image/png");
  fs.writeFileSync(outPath, buffer);
  console.log(`Wrote ${outPath} (${viewport.width}x${viewport.height})`);
  return canvasAndContext.canvas;
}

function samplePixelHex(canvas, x, y) {
  const ctx = canvas.getContext("2d");
  const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

async function main() {
  // Square gold-on-dark logo mark (full page 1 of D&S LOGO-Final.pdf)
  const markCanvas = await renderPdfPageToPng(
    LOGO_MARK_PDF,
    1,
    path.join(publicDir, "logo-mark.png"),
    4
  );

  // Small favicon-sized render
  await renderPdfPageToPng(LOGO_MARK_PDF, 1, path.join(publicDir, "favicon-source.png"), 0.5);

  // Full business-card lockup (page 1: logo + tagline on navy gradient)
  await renderPdfPageToPng(
    BUSINESS_CARD_PDF,
    1,
    path.join(publicDir, "logo-card.png"),
    4
  );

  // Sample brand colors from the mark: gold glyph area (center-ish) and dark background (corner)
  const w = markCanvas.width;
  const h = markCanvas.height;
  const gold = samplePixelHex(markCanvas, Math.round(w * 0.42), Math.round(h * 0.35));
  const dark = samplePixelHex(markCanvas, Math.round(w * 0.05), Math.round(h * 0.05));

  console.log("\nSampled brand colors:");
  console.log("  gold  :", gold);
  console.log("  dark  :", dark);
  console.log(
    "\nPaste these into app/globals.css @theme block as --color-gold / --color-navy base values."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
