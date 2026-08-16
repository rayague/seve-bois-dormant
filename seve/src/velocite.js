/**
 * ============================================================================
 * SÈVE — velocite.js
 * ----------------------------------------------------------------------------
 * Flou de vitesse. Le seul effet coûteux autorisé, et le seul qui donne la
 * sensation de caméra : un flou vertical proportionnel à la vélocité du
 * scroll, plafonné à 5 px. Au-delà, ça cesse d'être un mouvement et devient
 * un défaut d'affichage.
 *
 * Ce module ne s'applique jamais à la section ATELIER. Elle doit rester nue.
 * ============================================================================
 */

import gsap from 'gsap';

const PLAFOND = 5;

export function initVelocite({ lenis, reduit }) {
  if (reduit) return { actif: false, raison: 'prefers-reduced-motion' };

  const cibles = Array.from(document.querySelectorAll('[data-flou]'));
  if (!cibles.length) return { actif: false, raison: 'aucune cible' };

  let precedent = 0;
  let enCours = false;

  const appliquer = () => {
    enCours = false;
    const v = Math.min(Math.abs(lenis.velocity) / 40, 1);

    // On ne relance un tween que si la valeur bouge vraiment : sinon on
    // écrit un filtre à chaque frame de scroll pour rien.
    if (Math.abs(v - precedent) < .02) return;
    precedent = v;

    gsap.to(cibles, {
      filter: v < .01 ? 'blur(0px)' : `blur(${(v * PLAFOND).toFixed(2)}px)`,
      duration: .2,
      overwrite: true
    });
  };

  lenis.on('scroll', () => {
    if (enCours) return;
    enCours = true;
    requestAnimationFrame(appliquer);
  });

  return { actif: true, cibles: cibles.length, plafond: PLAFOND };
}
