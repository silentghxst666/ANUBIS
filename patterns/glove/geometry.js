// ANUBIS insulated driver glove — parametric base pattern (size M / men's 9).
// Units: millimetres, y up, x from the little-finger side on the palm view (right hand).
//
// Construction ("inseam" glove): palm (leather) + back (fabric) + set-in thumb + six
// fourchettes. Finger strips share the palm width; the stitch line sits SA inside each slit
// and the fourchettes are widened by 2·SA to give the finger back its full girth.

const SIZE = {
  name: "M (men's 9)",
  sa: 3, // seam allowance, shell (inseam)
  hem: 10, // wrist hem allowance
  ext: 13.2, // half hand thickness at the palm (+ ease), added on each body side
  cuff: 45, // finished length below the wrist line
  // Finger shares across the palm, little → index (sum = finished palm width at the knuckles).
  fingers: [
    { key: "little", ru: "мизинец", share: 20.7, t: 13.0, len: 64 },
    { key: "ring", ru: "безымянный", share: 24.3, t: 15.0, len: 79 },
    { key: "middle", ru: "средний", share: 25.5, t: 15.5, len: 83 },
    { key: "index", ru: "указательный", share: 25.5, t: 15.0, len: 75 },
  ],
  // Crotch heights above the wrist line: little|ring, ring|middle, middle|index.
  crotch: [100, 108, 108],
  outerBase: { little: 85, index: 95 }, // where the outer finger edges leave the body
  backExtra: 4, // back fingers longer (knuckles)
  thumb: { len: 65, base: 30, half: 42, hole: { x: 95, y: 45, a: 23, b: 13 } },
};

// ---------------------------------------------------------------- helpers

const sample = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
const quad = (p0, c, p1, n = 12) =>
  sample(n, (t) => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1],
  ]);
const cubic = (p0, c1, c2, p1, n = 16) =>
  sample(n, (t) => {
    const u = 1 - t;
    return [0, 1].map((k) => u ** 3 * p0[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t ** 3 * p1[k]);
  });
const length = (pts) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
const ellipse = (cx, cy, rx, ry, n = 72) => sample(n, (t) => [cx + rx * Math.cos(2 * Math.PI * t), cy + ry * Math.sin(2 * Math.PI * t)]).slice(0, -1);
/** Upper half-ellipse from (xl, y0) over the top to (xr, y0). */
const tipArc = (xl, xr, y0, top, n = 14) =>
  sample(n, (t) => {
    const a = Math.PI - Math.PI * t;
    return [(xl + xr) / 2 + ((xr - xl) / 2) * Math.cos(a), y0 + (top - y0) * Math.sin(a)];
  });
const push = (arr, pts) => {
  for (const p of pts) {
    const last = arr[arr.length - 1];
    if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 0.01) arr.push(p);
  }
};

// ---------------------------------------------------------------- palm / back

/**
 * Hand body with four fingers. `mode` "cut" = cutting line, "stitch" = sewing line.
 * `fingers` left → right as laid out on this piece; `crotch` between them; `outer` heights of
 * the two outer finger bases (left, right).
 */
function handPiece({ fingers, crotch, outer, ext, cuff, sa, hem, extraLen = 0 }, mode) {
  const cut = mode === "cut";
  const off = cut ? sa : 0; // outer edges grow by SA when cutting
  const slit = cut ? 0 : sa; // stitch lines stand SA away from each slit
  const width = ext * 2 + fingers.reduce((s, f) => s + f.share, 0);
  const pts = [];
  const bottom = cut ? -cuff - hem : -cuff;

  // share boundaries
  const xs = [ext];
  for (const f of fingers) xs.push(xs[xs.length - 1] + f.share);

  push(pts, [[-off, bottom], [-off, outer[0] - 25]]);
  const firstOuterX = ext - fingers[0].t / 2 - off;
  push(pts, quad([-off, outer[0] - 25], [-off, outer[0]], [firstOuterX, outer[0]]));

  fingers.forEach((f, i) => {
    const left = i === 0 ? firstOuterX : xs[i] + slit;
    const right = i === fingers.length - 1 ? xs[i + 1] + f.t / 2 + off : xs[i + 1] - slit;
    const baseL = i === 0 ? outer[0] : crotch[i - 1];
    const baseR = i === fingers.length - 1 ? outer[1] : crotch[i];
    const top = Math.max(baseL, baseR) + f.len + extraLen + (cut ? sa : 0);
    const y0 = top - (right - left) * 0.6;
    if (i > 0) {
      // up the left edge from the crotch
      push(pts, [[left, baseL + (cut ? 0 : sa)]]);
    }
    push(pts, [[left, y0]]);
    push(pts, tipArc(left, right, y0, top));
    if (i < fingers.length - 1) {
      // down into the crotch V
      push(pts, [[right, baseR + (cut ? 0 : sa)], [xs[i + 1], baseR - (cut ? 0 : sa)]]);
    }
  });

  const lastOuterX = xs[xs.length - 1] + fingers[fingers.length - 1].t / 2 + off;
  push(pts, [[lastOuterX, outer[1]]]);
  push(pts, quad([lastOuterX, outer[1]], [width + off, outer[1]], [width + off, outer[1] - 25]));
  push(pts, [[width + off, bottom]]);
  return { pts, xs, width };
}

// ---------------------------------------------------------------- thumb

function thumbPiece({ thumb, sa }, mode, holePerimeter) {
  // Folded piece, drawn opened: fold line on x = 0, side seam on x = ±half.
  const cut = mode === "cut";
  const off = cut ? sa : 0;
  const { half, base, len } = thumb;
  const H = base + len;
  // Base curve: from side seam (half, base) to fold bottom (0, 0); bulge tuned so the stitch
  // length per half equals half the thumb-hole stitch perimeter.
  const target = holePerimeter / 2;
  let bulge = 0;
  for (let k = 0; k < 60; k++) {
    const curve = cubic([half, base], [half + bulge, base * 0.35], [half * 0.45 + bulge * 0.4, -bulge * 0.15], [0, 0]);
    if (length(curve) >= target) break;
    bulge += 1;
  }
  const side = (s) => {
    const x = s * (half + off);
    const tipStart = H - half * 0.85;
    const pts = [];
    push(pts, [[0, H + off]]);
    push(pts, cubic([0, H + off], [x * 0.55, H + off], [x, H - half * 0.25], [x, tipStart]));
    push(pts, [[x, base]]);
    const b = cubic([x, base], [s * (half + bulge + off), base * 0.35], [s * (half * 0.45 + bulge * 0.4), -bulge * 0.15 - off], [0, -off]);
    push(pts, b);
    return pts;
  };
  const right = side(1);
  const left = side(-1).reverse();
  const pts = [];
  push(pts, right);
  push(pts, left);
  const stitchBase = cubic([half, base], [half + bulge, base * 0.35], [half * 0.45 + bulge * 0.4, -bulge * 0.15], [0, 0]);
  return { pts, H, bulge, baseLength: length(stitchBase) };
}

// ---------------------------------------------------------------- fourchette

function fourchette({ t, len, sa }, mode) {
  const cut = mode === "cut";
  const w = t + 2 * sa + (cut ? 2 * sa : 0); // finished width t + 2·SA (see header note)
  const L = len + (cut ? 2 * sa : 0);
  const v = 8;
  const y0 = cut ? -sa : 0;
  const top = y0 + L;
  const pts = [];
  push(pts, [[0, y0], [w / 2, y0 + v], [w / 2, top - 14]]);
  push(pts, quad([w / 2, top - 14], [w / 2, top], [0, top]));
  push(pts, quad([0, top], [-w / 2, top], [-w / 2, top - 14]));
  push(pts, [[-w / 2, y0 + v]]);
  return { pts, w, L };
}

// ---------------------------------------------------------------- pieces

function build(size = SIZE, { scale = 1, sa = size.sa, lining = false } = {}) {
  const s = (v) => v * scale;
  const F = size.fingers.map((f) => ({ ...f, share: s(f.share), t: s(f.t), len: s(f.len) }));
  const common = { ext: s(size.ext), cuff: s(size.cuff), sa, hem: size.hem };
  const crotch = size.crotch.map(s);
  const pieces = [];

  // Palm: right hand seen from the palm, little finger on the left.
  const palmArgs = { ...common, fingers: F, crotch, outer: [s(size.outerBase.little), s(size.outerBase.index)] };
  const palmCut = handPiece(palmArgs, "cut");
  const palmStitch = handPiece(palmArgs, "stitch");
  const h = size.thumb.hole;
  const hole = { x: s(h.x), y: s(h.y), a: s(h.a), b: s(h.b) };
  const holeStitch = ellipse(hole.x, hole.y, hole.b, hole.a);
  const holeCut = ellipse(hole.x, hole.y, hole.b - sa, hole.a - sa);
  const holePerimeter = length([...holeStitch, holeStitch[0]]);
  pieces.push({
    id: lining ? "L1" : "P1",
    name: lining ? "Подкладка — ладонь" : "Ладонь",
    en: lining ? "LINING PALM" : "PALM",
    material: lining ? "утеплитель / подкладка" : "кожа (коза/олень 0,7–0,9 мм)",
    qty: "1 пара (зеркально)",
    grain: lining ? "vertical" : "stretch",
    cut: palmCut.pts,
    stitch: palmStitch.pts,
    holes: [{ cut: holeCut, stitch: holeStitch }],
    notches: [
      ...crotch.map((y, i) => [palmCut.xs[i + 1], y]),
      [0 - sa, 0],
      [palmCut.width + sa, 0],
      [hole.x, hole.y + hole.a - sa],
      [hole.x, hole.y - hole.a + sa],
    ],
    marks: [{ type: "line", from: [-sa, 0], to: [palmCut.width + sa, 0], label: "линия запястья" }],
  });

  // Back: right hand seen from the back — fingers mirrored (index on the left).
  const backF = [...F].reverse();
  const backArgs = { ...common, fingers: backF, crotch: [...crotch].reverse(), outer: [s(size.outerBase.index), s(size.outerBase.little)], extraLen: s(size.backExtra) };
  const backCut = handPiece(backArgs, "cut");
  const backStitch = handPiece(backArgs, "stitch");
  pieces.push({
    id: lining ? "L2" : "P2",
    name: lining ? "Подкладка — тыл" : "Тыльная сторона",
    en: lining ? "LINING BACK" : "BACK",
    material: lining ? "утеплитель / подкладка" : "софтшелл / стрейч с мембраной",
    qty: "1 пара (зеркально)",
    grain: "vertical",
    cut: backCut.pts,
    stitch: backStitch.pts,
    holes: [],
    notches: [...[...crotch].reverse().map((y, i) => [backCut.xs[i + 1], y]), [-sa, 0], [backCut.width + sa, 0]],
    marks: lining
      ? [{ type: "line", from: [-sa, 0], to: [backCut.width + sa, 0], label: "линия запястья" }]
      : [
          {
            type: "line",
            from: [s(20), 0],
            to: [backCut.width - s(20), 0],
            // Elastic ≈ 55 % of the line: gathers the back so the wrist closes to ~21 cm.
            label: `резинка 6–8 мм: ${Math.round((backCut.width - s(40)) * 0.55)} мм растянуть на всю линию (${Math.round(backCut.width - s(40))} мм)`,
            dash: true,
          },
        ],
  });

  // Thumb, matched to the hole.
  const thumbArgs = { thumb: { ...size.thumb, len: s(size.thumb.len), base: s(size.thumb.base), half: s(size.thumb.half) }, sa };
  const tc = thumbPiece(thumbArgs, "cut", holePerimeter);
  const ts = thumbPiece(thumbArgs, "stitch", holePerimeter);
  pieces.push({
    id: lining ? "L3" : "P3",
    name: lining ? "Подкладка — большой палец" : "Большой палец",
    en: lining ? "LINING THUMB" : "THUMB",
    material: lining ? "утеплитель / подкладка" : "кожа (как ладонь)",
    qty: "1 пара (зеркально)",
    grain: lining ? "vertical" : "stretch",
    cut: tc.pts,
    stitch: ts.pts,
    holes: [],
    notches: [[0, -sa], [0, ts.H + sa]],
    marks: [{ type: "line", from: [0, 0], to: [0, ts.H], label: "линия сгиба", dash: true }],
    info: { holePerimeter, baseLength: ts.baseLength * 2 },
  });

  // Fourchettes: one per inner finger side.
  const sides = [
    [F[0], "мизинец — внутр."],
    [F[1], "безымянный — к мизинцу"],
    [F[1], "безымянный — к среднему"],
    [F[2], "средний — к безымянному"],
    [F[2], "средний — к указательному"],
    [F[3], "указательный — внутр."],
  ];
  sides.forEach(([f, label], i) => {
    const args = { t: f.t, len: f.len + s(2), sa };
    const c = fourchette(args, "cut");
    const st = fourchette(args, "stitch");
    pieces.push({
      id: (lining ? "L" : "P") + (4 + i),
      name: (lining ? "Подкладка — фуршет " : "Фуршет ") + (i + 1),
      sub: label,
      en: (lining ? "LINING FOURCHETTE " : "FOURCHETTE ") + (i + 1),
      material: lining ? "подкладка" : "ткань тыла (или кожа)",
      qty: "1 пара",
      grain: "vertical",
      cut: c.pts,
      stitch: st.pts,
      holes: [],
      notches: [[0, -sa], [0, c.L - sa]],
      marks: [],
    });
  });

  return { pieces, holePerimeter, palmWidth: palmCut.width };
}

module.exports = { SIZE, build, length };
