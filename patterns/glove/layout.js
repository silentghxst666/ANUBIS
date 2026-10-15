// Places one pattern set (shell or lining) on a sheet: title block on top, big pieces in the
// first row, fourchettes in the second. Coordinates are sheet millimetres, y down.

const GAP = 14;
const MARGIN = 15;
const TITLE_H = 110; // title block + 10 cm test square
const LABEL_H = 26; // text block above each piece

function bbox(pts) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

function layoutSet(pieces) {
  const rows = [pieces.slice(0, 3), pieces.slice(3)];
  const placed = [];
  let y = MARGIN + TITLE_H;
  let width = 0;
  for (const row of rows) {
    let x = MARGIN;
    let rowH = 0;
    for (const p of row) {
      const b = bbox(p.cut);
      const w = Math.max(b.maxX - b.minX, 38); // fourchettes get room for their label
      const h = b.maxY - b.minY;
      const ox = x;
      const oy = y;
      const tx = (pt) => [pt[0] - b.minX + ox, b.maxY - pt[1] + oy + LABEL_H];
      placed.push({ ...p, tx, box: { x: ox, y: oy, w, h: h + LABEL_H }, size: { w: b.maxX - b.minX, h } });
      x += w + GAP;
      rowH = Math.max(rowH, h + LABEL_H);
    }
    width = Math.max(width, x - GAP + MARGIN);
    y += rowH + GAP;
  }
  return { placed, width: Math.ceil(Math.max(width, 330)), height: Math.ceil(y - GAP + 6) };
}

module.exports = { layoutSet, bbox, MARGIN, TITLE_H, LABEL_H };
