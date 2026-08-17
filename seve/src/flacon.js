/**
 * ============================================================================
 * SÈVE — flacon.js
 * ----------------------------------------------------------------------------
 * Isolé volontairement : ce module pourra être remplacé par un rendu Blender
 * sans qu'aucun autre fichier ne bouge. Sa seule dépendance au reste du site
 * est la présence des attributs data-flacon dans le SVG.
 *
 * Pas de séquence d'images. La rotation est simulée en animant les masques
 * de lumière et les reflets d'un SVG unique — douze états suffisent à
 * lire le mouvement, et le fichier pèse deux kilo-octets au lieu de deux
 * cents.
 * ============================================================================
 */

import gsap from 'gsap';

/* Douze états de reflet : position et largeur du reflet large, position du
   reflet fin, compression de l'étiquette. Un tour de flacon, en somme. */
const ETATS = [
  { large: 82,  larg: 14, fin: 236, etiq: 1.00 },
  { large: 96,  larg: 17, fin: 244, etiq: .96 },
  { large: 112, larg: 20, fin: 250, etiq: .88 },
  { large: 130, larg: 22, fin: 254, etiq: .76 },
  { large: 150, larg: 21, fin: 252, etiq: .62 },
  { large: 170, larg: 18, fin: 246, etiq: .48 },
  { large: 188, larg: 15, fin: 236, etiq: .38 },
  { large: 204, larg: 12, fin: 222, etiq: .34 },
  { large: 216, larg: 10, fin: 206, etiq: .38 },
  { large: 224, larg: 9,  fin: 192, etiq: .48 },
  { large: 228, larg: 9,  fin: 182, etiq: .62 },
  { large: 230, larg: 10, fin: 178, etiq: .76 }
];


/* ---------------------------------------------------------------- tracé
   Masque chaque contour par son propre pointillé, et rend les aplats
   transparents. Le flacon existe alors sans être visible : il ne reste
   qu'à le dessiner.                                                      */

function amorcer(svg) {
  const mesurer = el => {
    if (!el.getTotalLength) return null;
    const l = el.getTotalLength();
    if (!l) return null;
    gsap.set(el, { strokeDasharray: l, strokeDashoffset: l });
    return el;
  };

  const contour = [...svg.querySelectorAll('.fl-arete, .fl-col')].map(mesurer).filter(Boolean);
  const graves  = [...svg.querySelectorAll('.fl-bouchon__grain, .fl-etiquette')].map(mesurer).filter(Boolean);
  const pleins  = [...svg.querySelectorAll(
    '.fl-verre, .fl-jus, .fl-surface, .fl-reflet, .fl-bouchon__bloc')];

  gsap.set(pleins, { opacity: 0 });
  return { contour, graves, pleins };
}

/* Le contour se dessine, puis le verre se remplit, puis les gravures.
   Toujours dans cet ordre : c'est celui d'une main qui dessine.          */
function tracer({ contour, graves, pleins }, { duree = 1.2 } = {}) {
  return gsap.timeline()
    .to(contour, { strokeDashoffset: 0, duration: duree, ease: 'power2.inOut' })
    .to(pleins,  { opacity: 1, duration: duree * .46, ease: 'power2.out', stagger: .07 }, `-=${duree * .38}`)
    .to(graves,  { strokeDashoffset: 0, duration: duree * .66, ease: 'power2.out', stagger: .06 }, `-=${duree * .29}`);
}


/* ---------------------------------------------------------------- module */

export function initFlacon({ reduit }) {
  const heroSvg  = document.querySelector('.hero .flacon');
  const grandSvg = document.querySelector('.flacon--grand');

  /* ------------------------------------------------------- flacon du hero
     Il se trace au lieu d'apparaître en fondu, en même temps que les deux
     lignes du titre montent. C'est le premier geste après la signature,
     donc le sommet de la courbe d'intensité : il a le droit d'être ample.

     Le tracé n'est pas déclenché ici mais rendu à main.js, qui le place
     dans la séquence d'entrée du hero — sinon il se jouerait derrière le
     rideau de la signature, et personne ne le verrait.                   */

  let tracerHero = () => gsap.timeline();

  if (heroSvg && !reduit) {
    const pieces = amorcer(heroSvg);
    tracerHero = () => tracer(pieces, { duree: 1.15 })
      .add(() => {
        /* Dérive ambiante : 4 px verticaux, cycle de 6 s. Elle ne démarre
           qu'une fois le flacon dessiné. C'est le seul mouvement permanent
           de la page — il lui donne un pouls sans demander l'attention. */
        gsap.to(heroSvg, {
          y: -4, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true
        });
      });
  }

  /* ------------------------------------------------- flacon de la section 02
     Même geste, déclenché à l'entrée de la section.                      */
  if (grandSvg && !reduit) {
    const pieces = amorcer(grandSvg);
    gsap.timeline({ scrollTrigger: { trigger: grandSvg, start: 'top 78%', once: true } })
      .add(tracer(pieces, { duree: 1.2 }));
  }

  /* ------------------------------------------ rotation scrubée au scroll */
  if (!grandSvg || reduit) return { tracerHero };

  const large = grandSvg.querySelector('[data-flacon="reflet-large"]');
  const fin   = grandSvg.querySelector('[data-flacon="reflet-fin"]');
  const etiq  = grandSvg.querySelector('.fl-etiquette');
  if (!large || !fin) return { tracerHero };

  gsap.set(etiq, { transformOrigin: '160px 334px' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: grandSvg.closest('.objet__scene') || grandSvg,
      start: 'top 85%',
      end: 'bottom 20%',
      scrub: .6
    }
  });

  ETATS.slice(1).forEach((e, i) => {
    const t = i / (ETATS.length - 2);
    tl.to(large, { attr: { x: e.large, width: e.larg }, ease: 'none' }, t)
      .to(fin,   { attr: { x: e.fin }, ease: 'none' }, t)
      .to(etiq,  { scaleX: e.etiq, ease: 'none' }, t);
  });

  return { tracerHero };
}
