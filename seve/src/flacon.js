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

export function initFlacon({ reduit }) {
  const heroSvg  = document.querySelector('.hero .flacon');
  const grandSvg = document.querySelector('.flacon--grand');

  /* ---------------------------------------------- dérive ambiante du hero
     4 px verticaux, cycle de 6 s. C'est le seul mouvement permanent de la
     page : il donne un pouls au hero sans jamais demander l'attention. */
  if (heroSvg && !reduit) {
    gsap.to(heroSvg, {
      y: -4,
      duration: 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });
  }

  /* ------------------------------------------------- tracé à l'arrivée
     Le contour se dessine, puis le verre se remplit. Une fois, à l'entrée
     de la section. Le flacon du hero en est exclu : il a déjà son entrée
     après la signature, et deux gestes coup sur coup s'annulent.         */
  if (grandSvg && !reduit) {
    const contour = grandSvg.querySelectorAll('.fl-arete, .fl-col');
    const graves  = grandSvg.querySelectorAll('.fl-bouchon__grain, .fl-etiquette');
    const pleins  = grandSvg.querySelectorAll(
      '.fl-verre, .fl-jus, .fl-surface, .fl-reflet, .fl-bouchon__bloc');

    const amorcer = el => {
      if (!el.getTotalLength) return null;
      const l = el.getTotalLength();
      if (!l) return null;
      gsap.set(el, { strokeDasharray: l, strokeDashoffset: l });
      return el;
    };
    const tracesContour = [...contour].map(amorcer).filter(Boolean);
    const tracesGravees = [...graves].map(amorcer).filter(Boolean);
    gsap.set(pleins, { opacity: 0 });

    gsap.timeline({ scrollTrigger: { trigger: grandSvg, start: 'top 78%', once: true } })
      .to(tracesContour, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' })
      .to(pleins, { opacity: 1, duration: .55, ease: 'power2.out', stagger: .07 }, '-=.45')
      .to(tracesGravees, { strokeDashoffset: 0, duration: .8, ease: 'power2.out', stagger: .06 }, '-=.35');
  }

  /* ------------------------------------------ rotation scrubée au scroll */
  if (!grandSvg || reduit) return;

  const large = grandSvg.querySelector('[data-flacon="reflet-large"]');
  const fin   = grandSvg.querySelector('[data-flacon="reflet-fin"]');
  const etiq  = grandSvg.querySelector('.fl-etiquette');
  if (!large || !fin) return;

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
}
