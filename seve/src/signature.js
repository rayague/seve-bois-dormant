/**
 * ============================================================================
 * PINEAPPLE EFFECT — signature.js
 * ----------------------------------------------------------------------------
 * Module autonome. Ne dépend d'aucun token, d'aucun DOM existant, d'aucun CSS
 * du projet hôte. Il crée son propre calque, joue, se nettoie, et disparaît.
 *
 * Seule dépendance : gsap.
 *
 *   import { playSignature, playWipe } from './signature.js';
 *
 *   await playSignature({
 *     peau:  '#B4622B',   // l'écorce de l'ananas
 *     chair: '#E9E4D8',   // l'intérieur révélé par les lames
 *     fond:  '#221D17'    // le noir du rideau
 *   });
 *
 * ----------------------------------------------------------------------------
 * LA CHORÉGRAPHIE — 6 plans, 2,00 s
 *
 *   1 · AMORCE      0,00 → 0,15   le noir, un halo qui monte
 *   2 · IMPACT      0,15 → 0,50   l'ananas arrive et se cale (overshoot + shake)
 *   3 · SUSPENSION  0,50 → 0,65   il flotte, une lumière balaye. LE SILENCE.
 *   4 · TRANCHAGE   0,65 → 1,25   ralenti, deux lames, la chair se révèle
 *   5 · ÉJECTION    1,25 → 1,70   vitesse réelle, trois directions, flou
 *   6 · RÉVÉLATION  1,70 → 2,00   le site apparaît
 *
 * Ne réécris pas ces durées. Le plan 3 paraît inutile : il ne l'est pas.
 * C'est lui qui donne son poids au plan 5.
 * ============================================================================
 */

import gsap from 'gsap';

/* ---------------------------------------------------------------- défauts */

const DEFAUTS = {
  peau:  '#E8A317',
  chair: '#FFE7A3',
  fond:  '#050403',
  accent: null,          // liseré des coupes — déduit de `chair` si absent
  duration: 2.0,         // durée totale visée, en secondes
  oncePerSession: true,
  skippable: true,
  motionBlur: true,      // flou directionnel à l'éjection (le seul effet coûteux)
  storageKey: 'pe-vu',
  zIndex: 9999,
  onComplete: null
};

const REDUIT = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------- le SVG */

function markup(c, uid) {
  const id = (n) => `${n}-${uid}`;
  return `
<svg viewBox="0 0 600 780" xmlns="http://www.w3.org/2000/svg"
     style="width:100%;height:auto;display:block;overflow:visible">
  <defs>
    <linearGradient id="${id('peau')}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0"   stop-color="${c.peauClair}"/>
      <stop offset=".42" stop-color="${c.peau}"/>
      <stop offset="1"   stop-color="${c.peauSombre}"/>
    </linearGradient>
    <linearGradient id="${id('chair')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"   stop-color="${c.chairSombre}"/>
      <stop offset=".45" stop-color="${c.chair}"/>
      <stop offset="1"   stop-color="${c.chairSombre}"/>
    </linearGradient>
    <linearGradient id="${id('feuille')}" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${c.peauSombre}"/>
      <stop offset="1" stop-color="${c.peau}"/>
    </linearGradient>
    <linearGradient id="${id('lame')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"   stop-color="${c.chair}" stop-opacity="0"/>
      <stop offset=".46" stop-color="${c.chair}" stop-opacity=".95"/>
      <stop offset=".54" stop-color="#ffffff"    stop-opacity="1"/>
      <stop offset="1"   stop-color="${c.chair}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="${id('balayage')}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0"  stop-color="${c.chair}" stop-opacity="0"/>
      <stop offset=".5" stop-color="${c.chair}" stop-opacity=".7"/>
      <stop offset="1"  stop-color="${c.chair}" stop-opacity="0"/>
    </linearGradient>

    <pattern id="${id('ecailles')}" width="38" height="38" patternUnits="userSpaceOnUse">
      <path d="M19,0 L38,19 L19,38 L0,19 Z" fill="none"
            stroke="${c.peauSombre}" stroke-opacity=".55" stroke-width="1.7"/>
      <circle cx="19" cy="19" r="2.6" fill="${c.peauSombre}" fill-opacity=".45"/>
    </pattern>

    <path id="${id('corps')}" d="M300,250 C378,250 406,318 406,420
                                 C406,548 368,650 300,650
                                 C232,650 194,548 194,420
                                 C194,318 222,250 300,250 Z"/>
    <clipPath id="${id('clipCorps')}"><use href="#${id('corps')}"/></clipPath>

    <g id="${id('ananas')}">
      <g fill="url(#${id('feuille')})">
        <path d="M300,272 C286,205 288,142 300,74 C312,142 314,205 300,272 Z"/>
        <path d="M300,272 C286,205 288,142 300,74 C312,142 314,205 300,272 Z" transform="rotate(-17 300 272)"/>
        <path d="M300,272 C286,205 288,142 300,74 C312,142 314,205 300,272 Z" transform="rotate(17 300 272)"/>
        <path d="M300,272 C288,215 290,162 300,104 C310,162 312,215 300,272 Z" transform="rotate(-34 300 272)"/>
        <path d="M300,272 C288,215 290,162 300,104 C310,162 312,215 300,272 Z" transform="rotate(34 300 272)"/>
        <path d="M300,272 C290,228 292,188 300,146 C308,188 310,228 300,272 Z" transform="rotate(-52 300 272)"/>
        <path d="M300,272 C290,228 292,188 300,146 C308,188 310,228 300,272 Z" transform="rotate(52 300 272)"/>
      </g>
      <use href="#${id('corps')}" fill="url(#${id('peau')})"/>
      <g clip-path="url(#${id('clipCorps')})">
        <rect x="180" y="240" width="240" height="420" fill="url(#${id('ecailles')})"/>
        <ellipse cx="228" cy="450" rx="52" ry="190" fill="${c.peauSombre}" opacity=".28"/>
        <ellipse cx="342" cy="380" rx="34" ry="120" fill="${c.chair}" opacity=".22"/>
      </g>
      <use href="#${id('corps')}" fill="none" stroke="${c.peauSombre}"
           stroke-opacity=".5" stroke-width="2.5"/>
    </g>

    <!-- découpes diagonales à -18° -->
    <clipPath id="${id('cHaut')}"><polygon points="-200,-300 800,-300 800,302 -200,497"/></clipPath>
    <clipPath id="${id('cMil')}"><polygon points="-200,497 800,302 800,432 -200,627"/></clipPath>
    <clipPath id="${id('cBas')}"><polygon points="-200,627 800,432 800,1100 -200,1100"/></clipPath>

    <filter id="${id('fHaut')}" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur data-blur="haut" stdDeviation="0 0"/></filter>
    <filter id="${id('fMil')}" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur data-blur="milieu" stdDeviation="0 0"/></filter>
    <filter id="${id('fBas')}" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur data-blur="bas" stdDeviation="0 0"/></filter>

    <filter id="${id('lueur')}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="7" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <g data-pine>
    <g data-slice="haut" filter="url(#${id('fHaut')})">
      <g clip-path="url(#${id('cHaut')})">
        <use href="#${id('ananas')}"/>
        <g clip-path="url(#${id('clipCorps')})">
          <rect data-chair="1" x="-100" y="405" width="800" height="30"
                fill="url(#${id('chair')})" transform="rotate(-18 300 420)" opacity="0"/>
          <rect data-arete="1" x="-100" y="418.5" width="800" height="3"
                fill="${c.accent}" transform="rotate(-18 300 420)" opacity="0"/>
        </g>
      </g>
    </g>

    <g data-slice="milieu" filter="url(#${id('fMil')})">
      <g clip-path="url(#${id('cMil')})">
        <use href="#${id('ananas')}"/>
        <g clip-path="url(#${id('clipCorps')})">
          <rect data-chair="1" x="-100" y="405" width="800" height="30"
                fill="url(#${id('chair')})" transform="rotate(-18 300 420)" opacity="0"/>
          <rect data-chair="2" x="-100" y="535" width="800" height="30"
                fill="url(#${id('chair')})" transform="rotate(-18 300 550)" opacity="0"/>
          <rect data-arete="1" x="-100" y="418.5" width="800" height="3"
                fill="${c.accent}" transform="rotate(-18 300 420)" opacity="0"/>
          <rect data-arete="2" x="-100" y="548.5" width="800" height="3"
                fill="${c.accent}" transform="rotate(-18 300 550)" opacity="0"/>
        </g>
      </g>
    </g>

    <g data-slice="bas" filter="url(#${id('fBas')})">
      <g clip-path="url(#${id('cBas')})">
        <use href="#${id('ananas')}"/>
        <g clip-path="url(#${id('clipCorps')})">
          <rect data-chair="2" x="-100" y="535" width="800" height="30"
                fill="url(#${id('chair')})" transform="rotate(-18 300 550)" opacity="0"/>
          <rect data-arete="2" x="-100" y="548.5" width="800" height="3"
                fill="${c.accent}" transform="rotate(-18 300 550)" opacity="0"/>
        </g>
      </g>
    </g>

    <g clip-path="url(#${id('clipCorps')})">
      <rect data-balayage x="-260" y="180" width="130" height="520"
            fill="url(#${id('balayage')})" transform="rotate(-18 300 420)"
            style="mix-blend-mode:screen" opacity="0"/>
    </g>

    <g style="mix-blend-mode:screen" filter="url(#${id('lueur')})">
      <rect data-lame="1" x="-760" y="411" width="760" height="9"
            fill="url(#${id('lame')})" transform="rotate(-18 300 420)" opacity="0"/>
      <rect data-lame="2" x="-760" y="541" width="760" height="9"
            fill="url(#${id('lame')})" transform="rotate(-18 300 550)" opacity="0"/>
    </g>
  </g>
</svg>`;
}

/* ------------------------------------------------------------- couleurs */

function melange(hex, vers, t) {
  const p = h => [1,3,5].map(i => parseInt(h.slice(i, i+2), 16));
  const [r1,g1,b1] = p(hex), [r2,g2,b2] = p(vers);
  const m = (a,b) => Math.round(a + (b - a) * t).toString(16).padStart(2,'0');
  return `#${m(r1,r2)}${m(g1,g2)}${m(b1,b2)}`;
}

function palette(o) {
  return {
    peau:        o.peau,
    peauClair:   melange(o.peau,  '#ffffff', .32),
    peauSombre:  melange(o.peau,  '#000000', .48),
    chair:       o.chair,
    chairSombre: melange(o.chair, '#000000', .22),
    accent:      o.accent || melange(o.chair, '#ffffff', .55),
    fond:        o.fond
  };
}

/* ---------------------------------------------------------------- calque */

function calque(o, c, uid) {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  el.setAttribute('role', 'presentation');
  el.style.cssText = `
    position:fixed;inset:0;z-index:${o.zIndex};background:${c.fond};
    display:grid;place-items:center;overflow:hidden;`;

  el.innerHTML = `
    <div data-halo style="position:absolute;inset:0;opacity:0;pointer-events:none;
      background:radial-gradient(circle at 50% 52%,
        ${c.peau}4d 0%, ${c.peau}12 34%, transparent 62%)"></div>
    <div data-stage style="width:min(74vmin,560px);will-change:transform">
      ${markup(c, uid)}
    </div>
    <svg data-grain style="position:absolute;inset:0;opacity:.055;
      pointer-events:none;mix-blend-mode:overlay" xmlns="http://www.w3.org/2000/svg">
      <filter id="bruit-${uid}">
        <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#bruit-${uid})"/>
    </svg>
    <div data-flash style="position:absolute;inset:0;opacity:0;pointer-events:none;
      background:#fff;mix-blend-mode:screen"></div>`;

  return el;
}

/* -------------------------------------------------------------- timeline */

function timeline(root, o, done) {
  const q     = s => Array.from(root.querySelectorAll(s));
  const one   = s => root.querySelector(s);
  const pine  = one('[data-pine]');
  const stage = one('[data-stage]');
  const sl    = {
    haut:   one('[data-slice="haut"]'),
    milieu: one('[data-slice="milieu"]'),
    bas:    one('[data-slice="bas"]')
  };

  gsap.set([pine, sl.haut, sl.milieu, sl.bas],
    { transformBox:'fill-box', transformOrigin:'center center' });

  // pilotage du flou directionnel via un proxy
  const flou = (nom, x, y) => {
    const n = root.querySelector(`[data-blur="${nom}"]`);
    return { get v(){ return 0; },
             set v(p){ n.setAttribute('stdDeviation', `${x*p} ${y*p}`); } };
  };
  const F = { haut: flou('haut',9,13), milieu: flou('milieu',16,3), bas: flou('bas',5,15) };

  // durées de référence (total 2,00 s)
  const d = { amorce:.15, impact:.35, suspension:.15, tranchage:.60, ejection:.45, reveal:.30 };
  const tl = gsap.timeline({ paused:true, onComplete:done });

  gsap.set(pine, { scale:.4, opacity:0, x:0, y:0 });
  gsap.set([sl.haut, sl.milieu, sl.bas], { x:0, y:0, rotation:0 });
  Object.values(F).forEach(f => f.v = 0);

  /* 1 · AMORCE */
  tl.to(one('[data-halo]'), { opacity:1, duration:d.amorce, ease:'none' }, 0);

  /* 2 · IMPACT */
  const t2 = d.amorce;
  tl.to(pine, { opacity:1, duration:.06, ease:'none' }, t2)
    .to(pine, { scale:1.045, duration:d.impact*.74, ease:'expo.out' }, t2)
    .to(pine, { scale:1, duration:d.impact*.26, ease:'power2.out' }, t2 + d.impact*.74)
    .fromTo(pine, { scaleX:.86 }, { scaleX:1, duration:d.impact, ease:'expo.out' }, t2)
    .to(one('[data-flash]'), { opacity:.30, duration:.033, ease:'none' }, t2 + d.impact*.62)
    .to(one('[data-flash]'), { opacity:0, duration:.10, ease:'power2.out' }, t2 + d.impact*.62 + .033)
    .to(stage, { x:4, duration:.033, yoyo:true, repeat:3, ease:'none' }, t2 + d.impact*.64)
    .set(stage, { x:0 });

  /* 3 · SUSPENSION — ne la supprime pas */
  const t3 = t2 + d.impact;
  tl.to(pine, { y:-3, duration:d.suspension, ease:'sine.inOut' }, t3)
    .fromTo(one('[data-balayage]'), { opacity:0, x:-40 },
      { opacity:1, x:760, duration:d.suspension*1.5, ease:'none' }, t3)
    .to(one('[data-balayage]'), { opacity:0, duration:.08 }, t3 + d.suspension*1.2);

  /* 4 · TRANCHAGE */
  const t4 = t3 + d.suspension;
  const lame = (n, retard) => {
    const el = one(`[data-lame="${n}"]`);
    tl.fromTo(el, { opacity:0, x:0 }, { opacity:1, duration:.07, ease:'none' }, t4 + retard)
      .to(el, { x:1420, duration:d.tranchage*.8, ease:'sine.inOut' }, t4 + retard)
      .to(el, { opacity:0, duration:.12 }, t4 + retard + d.tranchage*.7);
  };
  lame(1, 0); lame(2, .13);

  tl.to(q('[data-chair="1"]'), { opacity:1, duration:d.tranchage*.42, ease:'power1.out' }, t4 + .06)
    .to(q('[data-arete="1"]'), { opacity:1, duration:.10 }, t4 + .06)
    .to(q('[data-arete="1"]'), { opacity:.35, duration:d.tranchage*.5 }, t4 + .20)
    .to(q('[data-chair="2"]'), { opacity:1, duration:d.tranchage*.42, ease:'power1.out' }, t4 + .19)
    .to(q('[data-arete="2"]'), { opacity:1, duration:.10 }, t4 + .19)
    .to(q('[data-arete="2"]'), { opacity:.35, duration:d.tranchage*.5 }, t4 + .33);

  // séparation imperceptible + travelling lent
  tl.to(sl.haut,   { x:-2.5, y:-2, duration:d.tranchage, ease:'sine.inOut' }, t4)
    .to(sl.milieu, { x:1,    y:1,  duration:d.tranchage, ease:'sine.inOut' }, t4)
    .to(sl.bas,    { x:2.5,  y:3,  duration:d.tranchage, ease:'sine.inOut' }, t4)
    .to(pine,      { x:-8,         duration:d.tranchage, ease:'sine.inOut' }, t4);

  /* 5 · ÉJECTION */
  const t5 = t4 + d.tranchage, s = .035;
  const ej = (el, p, f, retard) => {
    tl.to(el, { x:p.x, y:p.y, rotation:p.r, duration:d.ejection, ease:'power4.in' }, t5 + retard);
    if (o.motionBlur) {
      tl.to(f, { v:1, duration:d.ejection*.55, ease:'power2.in' }, t5 + retard)
        .set(f, { v:0 }, t5 + d.ejection);
    }
  };
  ej(sl.haut,   { x:-330, y:-520, r: 180 }, F.haut,   0);
  ej(sl.milieu, { x: 700, y: -40, r:  90 }, F.milieu, s);
  ej(sl.bas,    { x: 120, y: 640, r:-220 }, F.bas,    s*2);

  /* 6 · RÉVÉLATION */
  const t6 = t5 + d.ejection;
  tl.to(one('[data-halo]'), { opacity:0, duration:d.reveal, ease:'none' }, t6)
    .to(root, { opacity:0, duration:d.reveal, ease:'power2.out' }, t6);

  const total = t6 + d.reveal;
  if (o.duration && o.duration !== total) tl.timeScale(total / o.duration);
  return tl;
}

/* ============================================================ API PUBLIQUE */

/**
 * Joue la signature. Retourne une Promise résolue à la fin (ou immédiatement
 * si l'animation est court-circuitée par `prefers-reduced-motion` ou la session).
 */
export function playSignature(options = {}) {
  const o   = { ...DEFAUTS, ...options };
  const c   = palette(o);
  const uid = Math.random().toString(36).slice(2, 8);

  let deja = false;
  try { deja = o.oncePerSession && sessionStorage.getItem(o.storageKey); } catch (_) {}

  // Sortie immédiate : mouvement réduit, ou déjà vue cette session.
  if (REDUIT() || deja) {
    const fondu = document.createElement('div');
    fondu.setAttribute('aria-hidden', 'true');
    fondu.style.cssText =
      `position:fixed;inset:0;z-index:${o.zIndex};background:${c.fond};pointer-events:none`;
    document.body.appendChild(fondu);
    return new Promise(res => {
      gsap.to(fondu, { opacity:0, duration:.3, ease:'power1.out',
        onComplete(){ fondu.remove(); o.onComplete?.(); res(); } });
    });
  }

  const root = calque(o, c, uid);
  document.body.appendChild(root);
  const scrollAvant = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  return new Promise(resolve => {
    const fin = () => {
      retirerEcouteurs();
      root.remove();
      document.body.style.overflow = scrollAvant;
      try { if (o.oncePerSession) sessionStorage.setItem(o.storageKey, '1'); } catch (_) {}
      o.onComplete?.();
      resolve();
    };

    const tl = timeline(root, o, fin);

    // Skip : on accélère au lieu de couper net — une coupure sèche se voit.
    const passer = () => {
      if (tl.progress() > .96) return;
      gsap.to(tl, { timeScale: tl.timeScale() * 5, duration:.25, ease:'power2.in' });
      retirerEcouteurs();
    };
    const evts = ['wheel','touchmove','click','keydown'];
    const retirerEcouteurs = () =>
      evts.forEach(e => window.removeEventListener(e, passer));
    if (o.skippable) evts.forEach(e => window.addEventListener(e, passer, { passive:true }));

    // On attend les polices : sinon le contenu derrière se recompose pendant
    // la révélation, et le CLS explose.
    (document.fonts?.ready ?? Promise.resolve()).then(() => tl.play());
  });
}

/**
 * Transition de page : les trois tranches deviennent trois bandes diagonales
 * qui balayent l'écran. C'est un wipe de montage — le même geste que la
 * signature, mais au service de la navigation.
 *
 *   await playWipe({ couleur:'#221D17' });
 *   // ... on change le contenu ici ...
 */
export function playWipe({ couleur = '#221D17', duration = .45, zIndex = 9998 } = {}) {
  if (REDUIT()) return Promise.resolve();

  const root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText =
    `position:fixed;inset:0;z-index:${zIndex};pointer-events:none;overflow:hidden`;

  const bandes = [0, 1, 2].map(i => {
    const b = document.createElement('div');
    b.style.cssText = `position:absolute;left:-60%;width:220%;height:${100/3 + 2}%;
      top:${i * (100/3)}%;background:${couleur};
      transform:translateX(-115%) rotate(-18deg);transform-origin:center`;
    root.appendChild(b);
    return b;
  });
  document.body.appendChild(root);

  return new Promise(resolve => {
    gsap.timeline({ onComplete(){ root.remove(); resolve(); } })
      .to(bandes, { xPercent:0, duration, ease:'power3.inOut', stagger:.05 })
      .to(bandes, { xPercent:115, duration, ease:'power3.inOut', stagger:.05 }, '+=.05');
  });
}

export default { playSignature, playWipe };
