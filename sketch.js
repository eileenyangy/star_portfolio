// --- Configuration ---
let W, H;
const NUM_POINTS = 5;

const BIG_RADIUS = 70;
const SMALL_RADIUS = 25;
const PULSE_AMOUNT = 0.12;

// 3D rotation speeds
const SPIN_Y = 0.7;
const SPIN_X = 0.25;
const SPIN_Z = 0.18;

const PERSPECTIVE = 400;

// Depth extrusion
const DEPTH_LAYERS = 5;
const DEPTH_SPACING = 8;

// ASCII characters
const CHARS = ["*", "*", "*", ".", "+", "·", "°", "*"];

const STEPS_BIG = 18;
const STEPS_SMALL = 8;

function setup() {
  W = windowWidth;
  H = windowHeight;
  createCanvas(W, H);
  textFont("monospace");
  textAlign(CENTER, CENTER);
  noStroke();
}

// Resize canvas when the container/window changes
function windowResized() {
  W = windowWidth;
  H = windowHeight;
  resizeCanvas(W, H);
}

function draw() {
  background(255);
  const t = millis() / 1000;

  const pulse = 1 + sin(t * 1.2) * PULSE_AMOUNT;

  const ax = t * SPIN_X;
  const ay = t * SPIN_Y;
  const az = t * SPIN_Z;

  // Small star orbit
  const smallZ = sin(t * 0.6) * 180;
  const smallX = cos(t * 0.4) * 20;
  const smallY = sin(t * 0.5) * 15;
  const smallSpin = -t * 0.8;

  let allPoints = [];

  generateStarEdgePoints(BIG_RADIUS, STEPS_BIG, pulse, ax, ay, az,
    0, 0, 0, 0, t, allPoints);

  generateStarEdgePoints(SMALL_RADIUS, STEPS_SMALL, pulse * 0.9, ax, ay, az,
    smallX, smallY, smallZ, smallSpin, t, allPoints);

  allPoints.sort((a, b) => a.z - b.z);

  push();
  translate(W / 2, H / 2);

  for (let i = 0; i < allPoints.length; i++) {
    const p = allPoints[i];

    const depthNorm = map(p.z, -300, 300, 0.1, 1.0, true);

    const region = noise(p.ox * 0.005 + t * 0.15, p.oy * 0.005 + t * 0.1);
    const regionAlpha = map(pow(region, 0.6), 0.3, 0.9, 40, 255, true);

    const alpha = depthNorm * (regionAlpha / 255) * 255;

    const sz = map(p.scale, 0.5, 1.5, 11, 18, true);

    fill(0, alpha);
    textSize(sz);
    text(p.ch, p.sx, p.sy);
  }

  pop();
}

function generateStarEdgePoints(radius, steps, pulse, ax, ay, az,
  offX, offY, offZ, extraSpin, t, out) {

  const verts = [];
  for (let i = 0; i < NUM_POINTS; i++) {
    const angle = -HALF_PI + (TWO_PI / NUM_POINTS) * i;
    verts.push({ x: cos(angle) * radius, y: sin(angle) * radius });
  }

  const halfDepth = floor(DEPTH_LAYERS / 2) * DEPTH_SPACING;

  for (let i = 0; i < NUM_POINTS; i++) {
    const a = verts[i];
    const b = verts[(i + 2) % NUM_POINTS];

    for (let s = 0; s <= steps; s++) {
      const frac = s / steps;
      const x = lerp(a.x, b.x, frac);
      const y = lerp(a.y, b.y, frac);

      for (let layer = 0; layer < DEPTH_LAYERS; layer++) {
        const z = -halfDepth + layer * DEPTH_SPACING;

        const proj = projectPoint(x, y, z, pulse, ax, ay, az,
          offX, offY, offZ, extraSpin);

        const charIdx = floor(noise(s * 0.3 + i, layer * 0.5, t * 0.5) * CHARS.length);
        proj.ch = CHARS[charIdx];
        proj.ox = x;
        proj.oy = y;

        out.push(proj);
      }
    }
  }
}

function projectPoint(x, y, z, pulse, ax, ay, az, offX, offY, offZ, extraSpin) {
  const ce = cos(extraSpin), se = sin(extraSpin);
  const cx = cos(ax), sx = sin(ax);
  const cy = cos(ay), sy = sin(ay);
  const cz = cos(az), sz = sin(az);

  if (extraSpin !== 0) {
    const rx = x * ce - y * se;
    const ry = x * se + y * ce;
    x = rx;
    y = ry;
  }

  x *= pulse;
  y *= pulse;
  z *= pulse;

  x += offX;
  y += offY;
  z += offZ;

  let x1 = x * cy + z * sy;
  let z1 = -x * sy + z * cy;

  let y1 = y * cx - z1 * sx;
  let z2 = y * sx + z1 * cx;

  let x2 = x1 * cz - y1 * sz;
  let y2 = x1 * sz + y1 * cz;

  let sc = PERSPECTIVE / (PERSPECTIVE + z2);
  return { sx: x2 * sc, sy: y2 * sc, z: z2, scale: sc };
}
