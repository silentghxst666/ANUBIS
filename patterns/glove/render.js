// Renders the glove pattern: full-size PDF, tiled A4 PDF, DXF (for CLO3D) and a PNG preview,
// for the shell set and the lining set.
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const sharp = require("sharp");
const { SIZE, build } = require("./geometry");
const { layoutSet, MARGIN } = require("./layout");

const OUT = process.argv[2] || "out";
const VERSION = "0.1";
const DATE = "2026-10-15";
const FONT = "C:/Windows/Fonts/arial.ttf";
const FONT_BOLD = "C:/Windows/Fonts/arialbd.ttf";
const PT = 72 / 25.4; // points per millimetre
// A4 tiling geometry (shared with the title block so the test square sits on one sheet).
const A4 = { margin: 8, overlap: 10, usable: [194, 281] };
const STEP = [A4.usable[0] - A4.overlap, A4.usable[1] - A4.overlap];
// Test square centred on sheet A2 (column 2 of row A), clear of the title text on A1.
const SQUARE = { x: STEP[0] + (A4.usable[0] - 100) / 2 - A4.margin + A4.margin, y: MARGIN };
fs.mkdirSync(OUT, { recursive: true });

const sets = [
  {
    key: "shell",
    title: "Верх перчатки",
    subtitle: "кожа (ладонь, палец) + ткань (тыл, фуршеты)",
    data: build(SIZE),
    sa: SIZE.sa,
  },
  {
    key: "lining",
    title: "Подкладка / утеплитель",
    subtitle: "те же детали, масштаб 96 %",
    data: build(SIZE, { scale: 0.96, sa: 5, lining: true }),
    sa: 5,
  },
];

// ---------------------------------------------------------------- drawing (PDF, mm units)

function polyline(doc, pts, close = true) {
  doc.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) doc.lineTo(p[0], p[1]);
  if (close) doc.closePath();
}

function arrow(doc, from, to, head = 3) {
  doc.moveTo(from[0], from[1]).lineTo(to[0], to[1]).stroke();
  for (const [a, b] of [
    [to, from],
    [from, to],
  ]) {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    doc
      .moveTo(b[0], b[1])
      .lineTo(b[0] - head * Math.cos(ang - 0.4), b[1] - head * Math.sin(ang - 0.4))
      .moveTo(b[0], b[1])
      .lineTo(b[0] - head * Math.cos(ang + 0.4), b[1] - head * Math.sin(ang + 0.4))
      .stroke();
  }
}

function text(doc, str, x, y, size, bold = false, color = "#000") {
  doc.font(bold ? "B" : "R").fontSize(size).fillColor(color).text(str, x, y, { lineBreak: false });
}

function drawTitle(doc, set, ox, oy, sheetWidth) {
  const x = ox + MARGIN;
  const y = oy + MARGIN;
  text(doc, "ANUBIS — утеплённая перчатка (driver)", x, y, 6.5, true);
  text(doc, `${set.title}: ${set.subtitle}`, x, y + 9, 4.2);
  text(doc, `Базовое лекало · размер ${SIZE.name} · версия ${VERSION} · ${DATE}`, x, y + 15, 3.6, false, "#444");
  text(doc, "Правая рука. Левую кроить зеркально (детали «пара»).", x, y + 21, 3.6, false, "#444");

  // legend
  const ly = y + 31;
  doc.lineWidth(0.5).strokeColor("#000").undash();
  doc.moveTo(x, ly + 1.5).lineTo(x + 12, ly + 1.5).stroke();
  text(doc, "линия кроя", x + 15, ly, 3.4);
  doc.lineWidth(0.3).dash(2, { space: 1.5 }).moveTo(x, ly + 7.5).lineTo(x + 12, ly + 7.5).stroke().undash();
  text(doc, `линия шва (припуск ${set.sa} мм, низ манжеты ${SIZE.hem} мм)`, x + 15, ly + 6, 3.4);
  doc.circle(x + 6, ly + 13.5, 1.2).fill("#c00");
  text(doc, "надсечка / метка совмещения", x + 15, ly + 12, 3.4);
  doc.lineWidth(0.3).strokeColor("#06c");
  arrow(doc, [x, ly + 19.5], [x + 12, ly + 19.5], 2);
  text(doc, "направление растяжения кожи / долевая нити ткани", x + 15, ly + 18, 3.4);

  // 10 cm test square
  const sx = ox + SQUARE.x;
  const sy = oy + SQUARE.y;
  doc.lineWidth(0.4).strokeColor("#000").rect(sx, sy, 100, 100).stroke();
  text(doc, "КОНТРОЛЬНЫЙ КВАДРАТ", sx + 4, sy + 4, 4, true);
  text(doc, "100 × 100 мм", sx + 4, sy + 10, 4);
  text(doc, "Печатать в масштабе 100 %", sx + 4, sy + 84, 3.4, false, "#444");
  text(doc, "(«Фактический размер», не «Вписать»)", sx + 4, sy + 89, 3.4, false, "#444");
  text(doc, "Если сторона не 100 мм — перепечатать.", sx + 4, sy + 94, 3.4, false, "#444");
}

function drawPiece(doc, p, ox, oy) {
  const T = (pt) => {
    const [x, y] = p.tx(pt);
    return [x + ox, y + oy];
  };
  doc.lineWidth(0.5).strokeColor("#000").undash();
  polyline(doc, p.cut.map(T));
  doc.stroke();
  for (const h of p.holes) {
    polyline(doc, h.cut.map(T));
    doc.stroke();
  }
  doc.lineWidth(0.3).dash(2, { space: 1.5 });
  polyline(doc, p.stitch.map(T));
  doc.stroke();
  for (const h of p.holes) {
    polyline(doc, h.stitch.map(T));
    doc.stroke();
  }
  doc.undash();
  for (const m of p.marks) {
    doc.lineWidth(0.3).strokeColor("#06c");
    if (m.dash) doc.dash(4, { space: 2 });
    else doc.dash(1, { space: 1 });
    const a = T(m.from);
    const b = T(m.to);
    doc.moveTo(a[0], a[1]).lineTo(b[0], b[1]).stroke().undash();
    // Vertical marks (thumb fold) get their label beside the line, below the top notch.
    const vertical = Math.abs(a[0] - b[0]) < 0.1;
    if (vertical) text(doc, m.label, a[0] + 1.5, Math.min(a[1], b[1]) + 8, 3, false, "#06c");
    else text(doc, m.label, Math.min(a[0], b[0]) + 2, Math.min(a[1], b[1]) - 4.5, 3, false, "#06c");
  }
  for (const n of p.notches) {
    const [x, y] = T(n);
    doc.circle(x, y, 1.2).fill("#c00");
  }

  // grain / stretch arrow in the middle of the piece body
  const cx = p.box.x + ox + p.size.w / 2;
  const cy = p.box.y + oy + 30 + p.size.h * (p.id.match(/[14]$|[5-9]$/) && p.size.w < 40 ? 0.45 : 0.62);
  doc.lineWidth(0.35).strokeColor("#06c");
  if (p.grain === "stretch") {
    arrow(doc, [cx - 22, cy], [cx + 22, cy]);
    text(doc, "растяжение кожи", cx - 13, cy + 2, 3, false, "#06c");
  } else {
    const len = Math.min(40, p.size.h * 0.5);
    arrow(doc, [cx, cy - len / 2], [cx, cy + len / 2]);
    // Narrow pieces: label under the arrow so it stays inside the outline.
    if (p.size.w < 45) text(doc, "долевая", cx - 5.5, cy + len / 2 + 2, 3, false, "#06c");
    else text(doc, "долевая", cx + 1.5, cy - 1.5, 3, false, "#06c");
  }

  // label block
  const lx = p.box.x + ox;
  const ly = p.box.y + oy;
  text(doc, `${p.id}  ${p.name}`, lx, ly, 4.2, true);
  let row = 6;
  if (p.sub) {
    text(doc, p.sub, lx, ly + row, 3.2);
    row += 4.5;
  }
  text(doc, p.material, lx, ly + row, 3.2, false, "#444");
  text(doc, `Кроить: ${p.qty} · M`, lx, ly + row + 4.5, 3.2, false, "#444");
}

function drawSet(doc, set, L, ox, oy) {
  drawTitle(doc, set, ox, oy, L.width);
  for (const p of L.placed) drawPiece(doc, p, ox, oy);
}

function newDoc(file, size) {
  const doc = new PDFDocument({ size, margin: 0, autoFirstPage: false, info: { Title: "ANUBIS glove pattern", Author: "ANUBIS" } });
  doc.registerFont("R", FONT);
  doc.registerFont("B", FONT_BOLD);
  const stream = fs.createWriteStream(path.join(OUT, file));
  doc.pipe(stream);
  return { doc, done: new Promise((r) => stream.on("finish", r)) };
}

// ---------------------------------------------------------------- full-size PDF

async function fullSize(set, L) {
  const { doc, done } = newDoc(`glove-M-${set.key}-fullsize.pdf`, [L.width * PT, L.height * PT]);
  doc.addPage();
  doc.scale(PT);
  drawSet(doc, set, L, 0, 0);
  doc.end();
  await done;
}

// ---------------------------------------------------------------- tiled A4

async function tiled(set, L) {
  const PAGE = [210, 297];
  const M = A4.margin; // printer margin
  const OVER = A4.overlap; // overlap between neighbouring sheets
  const usable = A4.usable;
  const step = STEP;
  const cols = Math.ceil((L.width - OVER) / step[0]);
  const rows = Math.ceil((L.height - OVER) / step[1]);
  const { doc, done } = newDoc(`glove-M-${set.key}-A4.pdf`, "A4");
  const name = (r, c) => `${String.fromCharCode(65 + r)}${c + 1}`;

  // Assembly map
  doc.addPage();
  doc.scale(PT);
  text(doc, "ANUBIS — лекала перчатки, размер M", 15, 15, 7, true);
  text(doc, `${set.title} · ${rows * cols} листов A4 · печатать 100 %`, 15, 25, 4.5);
  // Map sized so the whole sheet grid (not just the pieces) fits above the instructions.
  const gridW = (cols - 1) * step[0] + usable[0];
  const gridH = (rows - 1) * step[1] + usable[1];
  const k = Math.min(180 / gridW, 175 / gridH);
  const mx = 15;
  const my = 40;
  doc.save().translate(mx, my).scale(k);
  for (const p of L.placed) {
    doc.lineWidth(0.5 / k).strokeColor("#000");
    polyline(doc, p.cut.map(p.tx));
    doc.stroke();
  }
  doc.lineWidth(0.4 / k).strokeColor("#c00");
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      doc.rect(c * step[0], r * step[1], usable[0], usable[1]).stroke();
      doc.font("B").fontSize(4.5 / k).fillColor("#c00").text(name(r, c), c * step[0] + 6 / k, r * step[1] + 6 / k, { lineBreak: false });
    }
  doc.restore();
  const ty = my + gridH * k + 10;
  // Sheet that carries the 10 cm test square (top-right of the layout).
  const sq = [SQUARE.x + 50, SQUARE.y + 50];
  const sqName = name(Math.floor(sq[1] / step[1]), Math.min(cols - 1, Math.floor(sq[0] / step[0])));
  const how = [
    "Как собрать:",
    `1. Печатайте все листы в масштабе 100 % («Фактический размер»). Проверьте квадрат 100 × 100 мм на листе ${sqName}.`,
    `2. Листы соседствуют с перекрытием ${OVER} мм: обрежьте правый и нижний край листа по пунктиру «обрезать».`,
    "3. Совместите крестики соседних листов и склейте скотчем: сначала ряд A слева направо, затем ряд B и т. д.",
    "4. Вырежьте детали по сплошной линии кроя. Пунктир внутри — линия шва.",
  ];
  let yy = ty;
  how.forEach((s, i) => {
    doc.font(i === 0 ? "B" : "R").fontSize(i === 0 ? 4.2 : 3.6).fillColor("#000");
    doc.text(s, 15, yy, { width: 180 });
    yy = doc.y + 1.5;
  });

  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      doc.addPage();
      doc.scale(PT);
      doc.save();
      doc.rect(M, M, usable[0], usable[1]).clip();
      drawSet(doc, set, L, M - c * step[0], M - r * step[1]);
      doc.restore();
      // frame, trim lines and alignment crosses
      doc.lineWidth(0.2).strokeColor("#999").undash().rect(M, M, usable[0], usable[1]).stroke();
      doc.lineWidth(0.2).strokeColor("#c00").dash(1.5, { space: 1.5 });
      if (c < cols - 1) doc.moveTo(M + step[0], M).lineTo(M + step[0], M + usable[1]).stroke();
      if (r < rows - 1) doc.moveTo(M, M + step[1]).lineTo(M + usable[0], M + step[1]).stroke();
      doc.undash();
      const crosses = [
        [M + 5, M + 5],
        [M + step[0] + OVER / 2, M + 5],
        [M + 5, M + step[1] + OVER / 2],
        [M + step[0] + OVER / 2, M + step[1] + OVER / 2],
      ];
      doc.lineWidth(0.25).strokeColor("#c00");
      for (const [x, y] of crosses) doc.moveTo(x - 3, y).lineTo(x + 3, y).moveTo(x, y - 3).lineTo(x, y + 3).stroke();
      text(doc, `${name(r, c)}   ·   ${set.title}   ·   ряд ${String.fromCharCode(65 + r)}, лист ${c + 1} из ${cols}`, M, 2.5, 3.2, false, "#c00");
      if (c < cols - 1) text(doc, "обрезать ▸", M + step[0] - 13, M + usable[1] - 4, 2.8, false, "#c00");
    }
  doc.end();
  await done;
  return { rows, cols };
}

// ---------------------------------------------------------------- DXF (R12, mm, y up)

function dxf(set, L) {
  const lines = ["0", "SECTION", "2", "HEADER", "9", "$INSUNITS", "70", "4", "0", "ENDSEC", "0", "SECTION", "2", "ENTITIES"];
  const flip = (p) => [p[0], L.height - p[1]];
  const poly = (pts, layer, closed = true) => {
    lines.push("0", "POLYLINE", "8", layer, "66", "1", "70", closed ? "1" : "0");
    for (const p of pts.map(flip)) lines.push("0", "VERTEX", "8", layer, "10", p[0].toFixed(3), "20", p[1].toFixed(3));
    lines.push("0", "SEQEND", "8", layer);
  };
  const txt = (s, p, h, layer = "TEXT") => {
    const q = flip(p);
    lines.push("0", "TEXT", "8", layer, "10", q[0].toFixed(3), "20", q[1].toFixed(3), "40", String(h), "1", s);
  };
  for (const p of L.placed) {
    poly(p.cut.map(p.tx), "CUT");
    poly(p.stitch.map(p.tx), "SEAM");
    for (const h of p.holes) {
      poly(h.cut.map(p.tx), "CUT");
      poly(h.stitch.map(p.tx), "SEAM");
    }
    for (const n of p.notches) {
      const [x, y] = p.tx(n);
      poly([[x - 1.5, y], [x + 1.5, y]], "NOTCH", false);
      poly([[x, y - 1.5], [x, y + 1.5]], "NOTCH", false);
    }
    for (const m of p.marks) poly([p.tx(m.from), p.tx(m.to)], "MARK", false);
    txt(`${p.id} ${p.en} - SIZE M - CUT ${p.qty.startsWith("1 пара (з") ? "1 PAIR MIRRORED" : "1 PAIR"}`, [p.box.x, p.box.y + 6], 4);
  }
  lines.push("0", "ENDSEC", "0", "EOF");
  fs.writeFileSync(path.join(OUT, `glove-M-${set.key}.dxf`), lines.join("\r\n"));
}

// ---------------------------------------------------------------- preview PNG

async function preview(set, L) {
  const parts = [];
  const pathOf = (pts) => "M" + pts.map((p) => p.map((v) => v.toFixed(2)).join(" ")).join(" L") + " Z";
  for (const p of L.placed) {
    parts.push(`<path d="${pathOf(p.cut.map(p.tx))}" fill="none" stroke="#000" stroke-width="0.6"/>`);
    parts.push(`<path d="${pathOf(p.stitch.map(p.tx))}" fill="none" stroke="#555" stroke-width="0.35" stroke-dasharray="2 1.5"/>`);
    for (const h of p.holes) {
      parts.push(`<path d="${pathOf(h.cut.map(p.tx))}" fill="none" stroke="#000" stroke-width="0.6"/>`);
      parts.push(`<path d="${pathOf(h.stitch.map(p.tx))}" fill="none" stroke="#555" stroke-width="0.35" stroke-dasharray="2 1.5"/>`);
    }
    for (const n of p.notches) {
      const [x, y] = p.tx(n);
      parts.push(`<circle cx="${x}" cy="${y}" r="1.4" fill="#c00"/>`);
    }
    parts.push(`<text x="${p.box.x}" y="${p.box.y + 5}" font-size="5" font-family="Arial" font-weight="bold">${p.id} ${p.name}</text>`);
  }
  parts.push(`<rect x="${SQUARE.x}" y="${SQUARE.y}" width="100" height="100" fill="none" stroke="#000" stroke-width="0.5"/>`);
  parts.push(`<text x="${SQUARE.x + 4}" y="${SQUARE.y + 8}" font-size="5" font-family="Arial">100 × 100 мм</text>`);
  parts.push(`<text x="${MARGIN}" y="${MARGIN + 8}" font-size="7" font-family="Arial" font-weight="bold">ANUBIS — ${set.title}, M</text>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.width} ${L.height}" width="${L.width * 3}" height="${L.height * 3}"><rect width="100%" height="100%" fill="#fff"/>${parts.join("")}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT, `glove-M-${set.key}-preview.png`));
}

(async () => {
  const summary = {};
  for (const set of sets) {
    const L = layoutSet(set.data.pieces);
    await fullSize(set, L);
    const t = await tiled(set, L);
    dxf(set, L);
    await preview(set, L);
    summary[set.key] = { sheet: `${L.width} x ${L.height} mm`, a4: `${t.rows} x ${t.cols} = ${t.rows * t.cols} pages`, holePerimeter: set.data.holePerimeter.toFixed(1), thumbBase: set.data.pieces[2].info.baseLength.toFixed(1) };
  }
  console.log(JSON.stringify(summary, null, 1));
  for (const f of fs.readdirSync(OUT)) console.log(f.padEnd(34), fs.statSync(path.join(OUT, f)).size);
})();
