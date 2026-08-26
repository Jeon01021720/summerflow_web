// Summerflow 02-1 Composition / Background Check v2 — original-demo composition over verified 01-2F loose-chain physics.
// The physics model remains intentionally lightweight: free charm bodies + Verlet ropes + soft collisions.

const home = document.querySelector('.home');
const stage = document.querySelector('.stage');
const mainRing = document.querySelector('.main-ring');
const pageLogo = document.querySelector('.page-logo');
const charms = [...document.querySelectorAll('.charm')];
const stars = [...document.querySelectorAll('.star')];
const ropePaths = [...document.querySelectorAll('.rope-beads')];
const ropeBases = [...document.querySelectorAll('.rope-base')];
const ropeShadows = [...document.querySelectorAll('.rope-shadow')];
const destinationView = document.querySelector('.destination-view');
const homeButton = document.querySelector('.home-button');
const viewTitle = document.querySelector('[data-view-title]');
const viewCopy = document.querySelector('[data-view-copy]');
const viewIcon = document.querySelector('[data-view-icon]');
const viewKicker = document.querySelector('[data-view-kicker]');

const CLICK_THRESHOLD = 7;
const CHARM_GRAVITY = 0.42;
const CHARM_DAMPING = 0.992;
const MAX_SPEED = 18;
const ROPE_NODE_COUNT = 10;
const ROPE_GRAVITY = 0.72;
const ROPE_DAMPING = 0.985;
const ROPE_ITERATIONS = 8;
const ROPE_STRETCH = 14;
const TAUT_SPRING = 0.17;
const TAUT_DAMPING = 0.09;
const COLLISION_RESTITUTION = 0.34;
const COLLISION_FRICTION = 0.08;
const COLLISION_ITERATIONS = 4;

// attachX/Y are normalized positions inside each trimmed PNG and point to the real small eyelet.
const CHARM_PHYSICS = [
  // Camera / CD / Diary / Hanger / Envelope — larger poster layout and slightly wider lower fan.
  { anchorNX: -0.33, anchorNY: 0.25, ropeLength: 188, mass: 1.12, radiusFactor: .40, startAngle: -0.72, baseRotation:  5, attachX: .52575, attachY: .18367 },
  { anchorNX: -0.17, anchorNY: 0.35, ropeLength: 170, mass: 0.86, radiusFactor: .44, startAngle: -0.36, baseRotation: -5, attachX: .52663, attachY: .13803 },
  { anchorNX:  0.00, anchorNY: 0.39, ropeLength: 186, mass: 1.20, radiusFactor: .43, startAngle:  0.00, baseRotation: -2, attachX: .27982, attachY: .18206 },
  { anchorNX:  0.17, anchorNY: 0.35, ropeLength: 166, mass: 0.72, radiusFactor: .32, startAngle:  0.38, baseRotation: -2, attachX: .52110, attachY: .11705 },
  { anchorNX:  0.33, anchorNY: 0.25, ropeLength: 188, mass: 0.98, radiusFactor: .39, startAngle:  0.72, baseRotation: -7, attachX: .51321, attachY: .16949 },
];

const destinations = {
  'Lookbook': { title: 'LOOKBOOK', kicker: 'CAMERA', icon: '▣', copy: 'model shots & summer snapshots — placeholder' },
  'Clothes / Closet': { title: 'CLOSET', kicker: 'HANGER', icon: '⌁', copy: 'tees, fits & size notes — placeholder' },
  'Playlist': { title: 'PLAYLIST', kicker: 'CD', icon: '◉', copy: 'songs for the festival season — placeholder' },
  'About / Story': { title: 'STORY', kicker: 'DIARY', icon: '♡', copy: 'a tiny note about Summerflow — placeholder' },
  'Order': { title: 'ORDER', kicker: 'ENVELOPE', icon: '✉', copy: 'order form entry point — placeholder' },
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function degToRad(value) { return value * Math.PI / 180; }

function sceneScale() {
  return clamp(stage.offsetWidth / 760, .74, 1.10);
}

function ringCenter() {
  return {
    x: mainRing.offsetLeft + mainRing.offsetWidth / 2,
    y: mainRing.offsetTop + mainRing.offsetHeight / 2,
  };
}

function anchorPoint(state) {
  const ring = ringCenter();
  return {
    x: ring.x + mainRing.offsetWidth * state.anchorNX,
    y: ring.y + mainRing.offsetHeight * state.anchorNY,
  };
}

function attachmentOffset(state) {
  const localX = (state.attachX - .5) * state.el.offsetWidth;
  const localY = (state.attachY - .5) * state.el.offsetHeight;
  const angle = degToRad(state.baseRotation + state.rotation);
  return {
    x: localX * Math.cos(angle) - localY * Math.sin(angle),
    y: localX * Math.sin(angle) + localY * Math.cos(angle),
  };
}

function attachmentPoint(state) {
  const offset = attachmentOffset(state);
  return { x: state.x + offset.x, y: state.y + offset.y };
}

function stagePointer(event) {
  const rect = stage.getBoundingClientRect();
  const sx = stage.offsetWidth / rect.width || 1;
  const sy = stage.offsetHeight / rect.height || 1;
  return { x: (event.clientX - rect.left) * sx, y: (event.clientY - rect.top) * sy };
}

const states = charms.map((el, index) => ({
  el,
  path: ropePaths[index],
  basePath: ropeBases[index],
  shadowPath: ropeShadows[index],
  ...CHARM_PHYSICS[index],
  x: 0, y: 0, vx: 0, vy: 0,
  rotation: 0,
  collisionPulse: 0,
  dragging: false,
  pointerId: null,
  startClientX: 0,
  startClientY: 0,
  lastPointerX: 0,
  lastPointerY: 0,
  lastPointerTime: 0,
  grabOffsetX: 0,
  grabOffsetY: 0,
  moved: false,
  rope: [],
  segmentLength: 0,
  effectiveRopeLength: 0,
  radius: 0,
}));

function refreshDimensions(state) {
  const scale = sceneScale();
  state.effectiveRopeLength = state.ropeLength * scale;
  state.radius = Math.min(state.el.offsetWidth, state.el.offsetHeight) * state.radiusFactor;
}

function setInitialCharmPosition(state) {
  refreshDimensions(state);
  state.rotation = state.startAngle * 10;
  const a = anchorPoint(state);
  const d = state.effectiveRopeLength - 5;
  const targetAttach = {
    x: a.x + Math.sin(state.startAngle) * d,
    y: a.y + Math.cos(state.startAngle) * d,
  };
  const offset = attachmentOffset(state);
  state.x = targetAttach.x - offset.x;
  state.y = targetAttach.y - offset.y;
  state.vx = 0;
  state.vy = 0;
}

function buildRope(state) {
  const anchor = anchorPoint(state);
  const end = attachmentPoint(state);
  const nodes = [];
  for (let i = 0; i < ROPE_NODE_COUNT; i += 1) {
    const t = i / (ROPE_NODE_COUNT - 1);
    const x = anchor.x + (end.x - anchor.x) * t;
    const y = anchor.y + (end.y - anchor.y) * t + Math.sin(Math.PI * t) * 8 * sceneScale();
    nodes.push({ x, y, px: x, py: y });
  }
  state.rope = nodes;
  state.segmentLength = state.effectiveRopeLength / (ROPE_NODE_COUNT - 1);
}

function capVelocity(state) {
  const speed = Math.hypot(state.vx, state.vy);
  if (speed > MAX_SPEED) {
    state.vx = state.vx / speed * MAX_SPEED;
    state.vy = state.vy / speed * MAX_SPEED;
  }
}

function enforceCharmReach(state, bounce = false) {
  const a = anchorPoint(state);
  const end = attachmentPoint(state);
  const dx = end.x - a.x;
  const dy = end.y - a.y;
  const dist = Math.hypot(dx, dy) || .001;
  const maxLength = state.effectiveRopeLength + ROPE_STRETCH * sceneScale();
  if (dist <= maxLength) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const correction = dist - maxLength;
  state.x -= nx * correction;
  state.y -= ny * correction;

  const outward = state.vx * nx + state.vy * ny;
  if (outward > 0) {
    const factor = bounce ? 1.18 : 1;
    state.vx -= nx * outward * factor;
    state.vy -= ny * outward * factor;
  }
}

function applyTautRopeForce(state, dt) {
  const a = anchorPoint(state);
  const end = attachmentPoint(state);
  const dx = end.x - a.x;
  const dy = end.y - a.y;
  const dist = Math.hypot(dx, dy) || .001;
  const softTaut = state.effectiveRopeLength * .965;
  if (dist <= softTaut) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const stretch = dist - softTaut;
  const outward = state.vx * nx + state.vy * ny;
  const pull = stretch * TAUT_SPRING + Math.max(0, outward) * TAUT_DAMPING;
  state.vx -= nx * pull * dt;
  state.vy -= ny * pull * dt;
}

function solveCharmCollisions() {
  for (let iteration = 0; iteration < COLLISION_ITERATIONS; iteration += 1) {
    for (let i = 0; i < states.length; i += 1) {
      for (let j = i + 1; j < states.length; j += 1) {
        const a = states[i];
        const b = states[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        const minDist = a.radius + b.radius;
        if (dist >= minDist) continue;
        if (dist < .001) { dx = 1; dy = 0; dist = 1; }

        const nx = dx / dist;
        const ny = dy / dist;
        const tx = -ny;
        const ty = nx;
        const overlap = minDist - dist;
        const invA = a.dragging ? 0 : 1 / a.mass;
        const invB = b.dragging ? 0 : 1 / b.mass;
        const sumInv = invA + invB;
        if (sumInv <= 0) continue;

        const correction = overlap / sumInv * .82;
        if (!a.dragging) { a.x -= nx * correction * invA; a.y -= ny * correction * invA; }
        if (!b.dragging) { b.x += nx * correction * invB; b.y += ny * correction * invB; }

        const rvx = b.vx - a.vx;
        const rvy = b.vy - a.vy;
        const normalSpeed = rvx * nx + rvy * ny;
        if (normalSpeed < 0) {
          const impulse = -(1 + COLLISION_RESTITUTION) * normalSpeed / sumInv;
          if (!a.dragging) { a.vx -= nx * impulse * invA; a.vy -= ny * impulse * invA; }
          if (!b.dragging) { b.vx += nx * impulse * invB; b.vy += ny * impulse * invB; }

          const tangentSpeed = rvx * tx + rvy * ty;
          const frictionImpulse = -tangentSpeed * COLLISION_FRICTION / sumInv;
          if (!a.dragging) { a.vx -= tx * frictionImpulse * invA; a.vy -= ty * frictionImpulse * invA; }
          if (!b.dragging) { b.vx += tx * frictionImpulse * invB; b.vy += ty * frictionImpulse * invB; }

          const pulse = Math.min(1, Math.abs(normalSpeed) / 10);
          a.collisionPulse = Math.max(a.collisionPulse, pulse);
          b.collisionPulse = Math.max(b.collisionPulse, pulse);
        }

        enforceCharmReach(a, true);
        enforceCharmReach(b, true);
      }
    }
  }
}

function integrateRope(state, dt) {
  if (!state.rope.length) return;
  const a = anchorPoint(state);
  const end = attachmentPoint(state);
  const last = state.rope.length - 1;

  for (let i = 1; i < last; i += 1) {
    const p = state.rope[i];
    const vx = (p.x - p.px) * Math.pow(ROPE_DAMPING, dt);
    const vy = (p.y - p.py) * Math.pow(ROPE_DAMPING, dt);
    p.px = p.x;
    p.py = p.y;
    p.x += vx * dt;
    p.y += vy * dt + ROPE_GRAVITY * sceneScale() * dt * dt;
  }

  for (let iteration = 0; iteration < ROPE_ITERATIONS; iteration += 1) {
    state.rope[0].x = a.x;
    state.rope[0].y = a.y;
    state.rope[last].x = end.x;
    state.rope[last].y = end.y;

    for (let i = 0; i < last; i += 1) {
      const p1 = state.rope[i];
      const p2 = state.rope[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.hypot(dx, dy) || .001;
      const diff = (dist - state.segmentLength) / dist;

      if (i === 0) {
        p2.x -= dx * diff;
        p2.y -= dy * diff;
      } else if (i + 1 === last) {
        p1.x += dx * diff;
        p1.y += dy * diff;
      } else {
        const half = diff * .5;
        p1.x += dx * half;
        p1.y += dy * half;
        p2.x -= dx * half;
        p2.y -= dy * half;
      }
    }
  }

  state.rope[0].x = a.x;
  state.rope[0].y = a.y;
  state.rope[last].x = end.x;
  state.rope[last].y = end.y;
}

function ropePathD(nodes) {
  if (!nodes.length) return '';
  if (nodes.length < 3) return `M ${nodes[0].x} ${nodes[0].y} L ${nodes.at(-1).x} ${nodes.at(-1).y}`;
  let d = `M ${nodes[0].x.toFixed(2)} ${nodes[0].y.toFixed(2)}`;
  for (let i = 1; i < nodes.length - 1; i += 1) {
    const p = nodes[i];
    const next = nodes[i + 1];
    const mx = (p.x + next.x) / 2;
    const my = (p.y + next.y) / 2;
    d += ` Q ${p.x.toFixed(2)} ${p.y.toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`;
  }
  const last = nodes[nodes.length - 1];
  d += ` T ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

function render(state) {
  state.el.style.left = `${state.x - state.el.offsetWidth / 2}px`;
  state.el.style.top = `${state.y - state.el.offsetHeight / 2}px`;
  state.el.style.setProperty('--base-rotate', `${state.baseRotation}deg`);
  state.el.style.setProperty('--physics-rotate', `${state.rotation.toFixed(2)}deg`);
  state.el.style.setProperty('--collision-scale', `${(1 + state.collisionPulse * .045).toFixed(3)}`);

  const d = ropePathD(state.rope);
  if (state.path) state.path.setAttribute('d', d);
  if (state.basePath) state.basePath.setAttribute('d', d);
  if (state.shadowPath) state.shadowPath.setAttribute('d', d);
}

function resetLooseBundle() {
  for (const state of states) setInitialCharmPosition(state);
  for (const state of states) buildRope(state);
  for (let i = 0; i < 8; i += 1) solveCharmCollisions();
  for (const state of states) {
    for (let i = 0; i < 22; i += 1) integrateRope(state, 1);
    render(state);
  }
  resolveStarOverlaps();
}

function rectFromEl(el, offsetX = 0, offsetY = 0) {
  return {
    left: el.offsetLeft + offsetX,
    top: el.offsetTop + offsetY,
    right: el.offsetLeft + offsetX + el.offsetWidth,
    bottom: el.offsetTop + offsetY + el.offsetHeight,
  };
}

function rectsIntersect(a, b) {
  return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
}

function resolveStarOverlaps() {
  if (!stars.length) return;
  const stageOffsetX = stage.offsetLeft;
  const stageOffsetY = stage.offsetTop;
  const phoneRect = rectFromEl(document.querySelector('.phone'), stageOffsetX, stageOffsetY);
  const ringRect = rectFromEl(mainRing, stageOffsetX, stageOffsetY);
  const logoRect = pageLogo ? rectFromEl(pageLogo, stageOffsetX, stageOffsetY) : phoneRect;
  let safeRect = {
    left: Math.min(phoneRect.left, ringRect.left, logoRect.left),
    top: Math.min(phoneRect.top, ringRect.top, logoRect.top),
    right: Math.max(phoneRect.right, ringRect.right, logoRect.right),
    bottom: Math.max(phoneRect.bottom, ringRect.bottom, logoRect.bottom),
  };

  for (const state of states) {
    const r = rectFromEl(state.el, stageOffsetX, stageOffsetY);
    safeRect = {
      left: Math.min(safeRect.left, r.left),
      top: Math.min(safeRect.top, r.top),
      right: Math.max(safeRect.right, r.right),
      bottom: Math.max(safeRect.bottom, r.bottom),
    };
  }

  const padX = Math.max(16, stage.offsetWidth * 0.03);
  const padY = Math.max(18, stage.offsetHeight * 0.024);
  safeRect = {
    left: safeRect.left - padX,
    top: safeRect.top - padY,
    right: safeRect.right + padX,
    bottom: safeRect.bottom + padY,
  };

  const sideSlots = [
    { left: 2.5, top: 7 }, { left: 10, top: 19 }, { left: 5, top: 35 }, { left: 8, top: 57 }, { left: 6, top: 81 },
    { left: 85, top: 6 }, { left: 90, top: 20 }, { left: 87, top: 41 }, { left: 91, top: 64 }, { left: 84, top: 84 },
    { left: 18, top: 4 }, { left: 75, top: 4 }, { left: 18, top: 92 }, { left: 74, top: 93 },
  ];

  let slotIndex = 0;
  for (const star of stars) {
    star.style.left = '';
    star.style.right = '';
    star.style.top = '';
    star.style.bottom = '';
  }

  // keep authored positions first, then move only conflicting stars.
  for (const star of stars) {
    const rect = rectFromEl(star);
    if (!rectsIntersect(rect, safeRect)) continue;

    for (let attempts = 0; attempts < sideSlots.length; attempts += 1) {
      const slot = sideSlots[(slotIndex + attempts) % sideSlots.length];
      star.style.left = `${slot.left}%`;
      star.style.top = `${slot.top}%`;
      const moved = rectFromEl(star);
      if (!rectsIntersect(moved, safeRect)) {
        slotIndex = (slotIndex + attempts + 1) % sideSlots.length;
        break;
      }
    }
  }
}

function openDestination(name) {
  const destination = destinations[name];
  if (!destination || !destinationView) return;
  viewTitle.textContent = destination.title;
  viewCopy.textContent = destination.copy;
  viewIcon.textContent = destination.icon;
  viewKicker.textContent = destination.kicker;
  destinationView.classList.add('is-open');
  destinationView.setAttribute('aria-hidden', 'false');
  homeButton.focus({ preventScroll: true });
}

function closeDestination() {
  if (!destinationView?.classList.contains('is-open')) return;
  destinationView.classList.remove('is-open');
  destinationView.setAttribute('aria-hidden', 'true');
}

states.forEach((state) => {
  const { el } = state;

  el.addEventListener('pointerdown', (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    el.setPointerCapture?.(event.pointerId);
    const p = stagePointer(event);
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.startClientX = event.clientX;
    state.startClientY = event.clientY;
    state.lastPointerX = event.clientX;
    state.lastPointerY = event.clientY;
    state.lastPointerTime = performance.now();
    state.grabOffsetX = p.x - state.x;
    state.grabOffsetY = p.y - state.y;
    state.vx = 0;
    state.vy = 0;
    state.moved = false;
    el.classList.add('is-dragging');
  });

  el.addEventListener('pointermove', (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    event.preventDefault();

    const p = stagePointer(event);
    state.x = p.x - state.grabOffsetX;
    state.y = p.y - state.grabOffsetY;
    enforceCharmReach(state, false);

    const now = performance.now();
    const dtMs = Math.max(8, now - state.lastPointerTime);
    const stageRect = stage.getBoundingClientRect();
    const scaleX = stage.offsetWidth / stageRect.width || 1;
    const scaleY = stage.offsetHeight / stageRect.height || 1;
    state.vx = clamp((event.clientX - state.lastPointerX) * scaleX / dtMs * 16.67, -MAX_SPEED, MAX_SPEED);
    state.vy = clamp((event.clientY - state.lastPointerY) * scaleY / dtMs * 16.67, -MAX_SPEED, MAX_SPEED);
    state.lastPointerX = event.clientX;
    state.lastPointerY = event.clientY;
    state.lastPointerTime = now;
    state.moved ||= Math.hypot(event.clientX - state.startClientX, event.clientY - state.startClientY) > CLICK_THRESHOLD;

    solveCharmCollisions();
    for (const other of states) integrateRope(other, .8);
    states.forEach(render);
  });

  function release(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    state.dragging = false;
    state.pointerId = null;
    el.classList.remove('is-dragging');
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    capVelocity(state);
    if (!state.moved) openDestination(el.dataset.destination);
  }

  el.addEventListener('pointerup', release);
  el.addEventListener('pointercancel', release);
  el.addEventListener('click', (event) => {
    event.preventDefault();
    if (event.detail === 0) openDestination(el.dataset.destination);
  });
});

homeButton.addEventListener('click', closeDestination);
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDestination(); });

let lastFrame = performance.now();
function tick(now) {
  const dt = clamp((now - lastFrame) / 16.67, .55, 1.8);
  lastFrame = now;
  let activeDrags = 0;
  let pullX = 0;

  for (const state of states) {
    if (!state.dragging) {
      state.vy += CHARM_GRAVITY * dt;
      applyTautRopeForce(state, dt);
      state.vx *= Math.pow(CHARM_DAMPING, dt);
      state.vy *= Math.pow(CHARM_DAMPING, dt);
      capVelocity(state);
      state.x += state.vx * dt;
      state.y += state.vy * dt;
      enforceCharmReach(state, true);
    } else {
      activeDrags += 1;
      const a = anchorPoint(state);
      const end = attachmentPoint(state);
      pullX += (end.x - a.x) / state.effectiveRopeLength;
    }
  }

  solveCharmCollisions();

  for (const state of states) {
    integrateRope(state, dt);
    if (!state.dragging) {
      const desiredRotation = clamp(state.vx * 1.02 + (state.x - anchorPoint(state).x) * .026, -20, 20);
      state.rotation += (desiredRotation - state.rotation) * .105 * dt;
    } else {
      state.rotation += (clamp(state.vx * 1.16, -22, 22) - state.rotation) * .19 * dt;
    }
    state.collisionPulse *= Math.pow(.74, dt);
    render(state);
  }

  const ringPull = activeDrags ? pullX / activeDrags : 0;
  mainRing.style.setProperty('--ring-x', `${clamp(ringPull * 2.3, -3, 3).toFixed(2)}px`);
  mainRing.style.setProperty('--ring-y', `${(activeDrags ? 1.1 : 0).toFixed(2)}px`);
  mainRing.style.setProperty('--ring-rotate', `${clamp(ringPull * 3.1, -3.8, 3.8).toFixed(2)}deg`);

  requestAnimationFrame(tick);
}

function bootSequence() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Blank LCD first, then the independent pixel logo grows from the center line.
  const bootDelay = reduceMotion ? 0 : 1000;
  const settleDelay = reduceMotion ? 0 : 2350;
  window.setTimeout(() => stage.classList.add('is-booted'), bootDelay);
  window.setTimeout(() => home.classList.add('is-settled'), settleDelay);
}

window.addEventListener('resize', resetLooseBundle);
window.addEventListener('load', () => {
  resetLooseBundle();
  bootSequence();
});

resetLooseBundle();
requestAnimationFrame(tick);

window.__summerflowPhysics = {
  version: '02-1-composition-boot-v7',
  model: 'free-charm-verlet-loose-chain-collision-with-attachment-hotspots',
  states,
  anchorPoint,
  attachmentPoint,
  resetLooseBundle,
};
