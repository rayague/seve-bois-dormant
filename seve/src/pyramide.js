/**
 * ============================================================================
 * SÈVE, pyramide.js
 * ----------------------------------------------------------------------------
 * Le seul vrai morceau technique. Deux choses :
 *
 *   1. Le fond de la section s'interpole EN CONTINU sur le scroll, du limon
 *      à l'écorce. C'est le concept de la page : elle s'assombrit en
 *      descendant, comme on parcourt la pyramide olfactive de haut en bas.
 *
 *   2. La couleur du texte ne suit PAS la même courbe. Elle bascule, aux
 *      seuils calculés dans tokens.css.
 *
 * ----------------------------------------------------------------------------
 * POURQUOI LES DEUX COURBES SONT DÉSYNCHRONISÉES
 *
 * Entre L(fond) = 0,1339 et L(fond) = 0,2326, aucune couleur de la palette
 * n'atteint 4,5:1, ni --ecorce, ni --craie. C'est une propriété du fond
 * mi-ton, pas un réglage : sur un gris moyen, le maximum théorique est
 * d'environ 4,6:1 et il faut du noir pur ou du blanc pur pour l'atteindre.
 *
 * Cette bande morte est donc infranchissable « proprement ». La seule
 * réponse est de la traverser vite, et là où aucun bloc n'est en zone de
 * lecture : chaque palier tient sa couleur pleine sous son texte et ne
 * descend vers le suivant que dans son dernier septième.
 *
 * Personne ne perçoit que les deux courbes ne sont pas synchrones.
 * Tout le monde perçoit un texte illisible.
 * ============================================================================
 */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

/* ------------------------------------------------------------- couleur */

const lin = c => { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };

export const luminance = ([r, g, b]) => .2126 * lin(r) + .7152 * lin(g) + .0722 * lin(b);

export function versRGB(v) {
  const s = String(v).trim();
  if (s[0] === '#') return [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  return (s.match(/\d+(\.\d+)?/g) || [0, 0, 0]).slice(0, 3).map(Number);
}

const melange = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = c => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

/* ---------------------------------------------------------------- module */

export function initPyramide({ tokens, seuils, reduit }) {
  const section = document.querySelector('.pyramide');
  if (!section) return;

  const fond    = section.querySelector('.pyramide__fond');
  const paliers = Array.from(section.querySelectorAll('.palier'));
  if (!fond || paliers.length !== 3) return;

  const T = {
    tete:   versRGB(tokens.fondTete),
    coeur:  versRGB(tokens.fondCoeur),
    bas:    versRGB(tokens.fondBas)
  };

  /* Les mêmes arrêts que la version CSS sans JavaScript : le palier reste
     plein sous son bloc de texte, puis descend à la toute fin. Ces valeurs
     doivent rester identiques à celles de sections.css, sinon la page avec
     et sans JavaScript ne raconte plus la même chose. */
  const arrets = [
    { el: paliers[0], de: T.tete,  vers: T.coeur, bascule: .78 },
    { el: paliers[1], de: T.coeur, vers: T.bas,   bascule: .86 },
    { el: paliers[2], de: T.bas,   vers: T.bas,   bascule: 1 }
  ];

  /* Couleur du fond pour la position de lecture courante, le centre du
     viewport, c'est-à-dire ce qu'il y a derrière le texte qu'on lit. */
  function couleurCourante() {
    const centre = innerHeight / 2;
    for (const a of arrets) {
      const r = a.el.getBoundingClientRect();
      if (centre >= r.top && centre <= r.bottom) {
        const f = (centre - r.top) / (r.height || 1);
        if (f <= a.bascule) return a.de;
        return melange(a.de, a.vers, (f - a.bascule) / (1 - a.bascule));
      }
    }
    const premier = arrets[0].el.getBoundingClientRect();
    return centre < premier.top ? T.tete : T.bas;
  }

  /* Les trois états de texte. Chacun est le meilleur disponible pour la
     luminance de fond courante ; entre les deux seuils on est dans la
     bande morte, où aucun bloc n'est en position de lecture. */
  let precedent = '';
  function appliquerTexte(L) {
    /* Le corps bascule au point d'égalité des deux couleurs : au-dessus
       --ecorce est la meilleure, en dessous --craie. Dans la bande morte
       aucune des deux n'atteint 4,5:1, mais on est toujours sur la moins
       mauvaise, et aucun bloc n'y est en zone de lecture. */
    const corps = L >= seuils.basculeCorps ? tokens.ecorce : tokens.craie;

    /* Les matières ont un seuil de plus que le corps : --seve-txt n'est
       lisible que sur --limon pur. Dès que le fond descend vers
       --fond-coeur, elles repassent en --matiere-coeur. */
    const matiere = L >= seuils.matiereTete ? tokens.seveTxt
                  : L >= seuils.texteSombre ? tokens.matiereCoeur
                  : L <= seuils.matiereFond ? tokens.resineTxt
                  : corps;

    const cle = corps + matiere;
    if (cle === precedent) return;
    precedent = cle;

    section.style.setProperty('--pyr-corps', corps);
    section.style.setProperty('--pyr-matiere', matiere);
  }

  function peindre() {
    const c = couleurCourante();
    fond.style.backgroundColor = rgb(c);
    appliquerTexte(luminance(c));
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: peindre,
    onRefresh: peindre
  });
  peindre();

  /* Point d'entrée de vérification : permet d'auditer le contraste à chaque
     position de scroll sans dépendre de la boucle de rendu. Vite le retire
     du build de production, il n'existe qu'en développement. */
  if (import.meta.env.DEV) {
    window.__pyrTest = { peindre, couleurCourante, luminance };
  }

  /* ------------------------------------------------- révélation mot à mot
     Jamais lettre par lettre : c'est un tic qu'on voit partout et qui
     ralentit la lecture. Jouée une fois, pas de replay au scroll inverse. */

  paliers.forEach(palier => {
    const p = palier.querySelector('.corps');
    if (!p) return;

    if (reduit) {
      gsap.fromTo(p, { opacity: 0 }, {
        opacity: 1, duration: .3, ease: 'none',
        scrollTrigger: { trigger: palier, start: 'top 65%', once: true }
      });
      return;
    }

    /* On ne découpe que sur les espaces ordinaires. `\s` avalerait aussi
       l'espace insécable, et « pas : il » se retrouverait coupé en deux
       mots, un deux-points pourrait alors ouvrir une ligne, ce que la
       typographie française interdit. */
    const mots = p.textContent.replace(/[\n\r\t ]+/g, ' ').trim().split(' ');
    p.textContent = '';
    const spans = mots.map((mot, i) => {
      const s = document.createElement('span');
      s.className = 'mot';
      s.textContent = mot;
      p.append(s);
      if (i < mots.length - 1) p.append(document.createTextNode(' '));
      return s;
    });

    gsap.fromTo(spans,
      { y: 14, opacity: 0 },
      {
        y: 0, opacity: 1,
        duration: .5, ease: 'power2.out', stagger: .03,
        scrollTrigger: { trigger: palier, start: 'top 65%', once: true }
      });
  });

  revelerPlanches(reduit);
}


/* ------------------------------------------------- tracé des planches
   Chaque dessin se trace lui-même, une seule fois, à l'arrivée du palier.
   C'est volontairement le geste le plus spectaculaire de la page, et
   c'est pour ça qu'il ne se répète jamais et ne boucle pas. Un trait qui
   se redessine en permanence cesse d'être un geste et devient un décor.  */

function revelerPlanches(reduit) {
  document.querySelectorAll('.planche').forEach(planche => {
    const palier  = planche.closest('.palier') || planche;
    const dessins = Array.from(planche.querySelectorAll('.dessin'));
    const accents = Array.from(planche.querySelectorAll('.accent'));

    if (reduit) {
      gsap.fromTo(dessins, { opacity: 0 }, {
        opacity: 1, duration: .3, ease: 'none',
        scrollTrigger: { trigger: palier, start: 'top 65%', once: true }
      });
      return;
    }

    // On mesure chaque tracé pour le masquer par son propre pointillé.
    const traits = [];
    dessins.forEach(svg => {
      svg.querySelectorAll('path, circle').forEach(el => {
        if (el.classList.contains('accent') || !el.getTotalLength) return;
        const longueur = el.getTotalLength();
        if (!longueur) return;
        gsap.set(el, { strokeDasharray: longueur, strokeDashoffset: longueur });
        traits.push(el);
      });
    });
    if (!traits.length) return;

    gsap.set(accents, {
      opacity: 0, scale: 0,
      transformBox: 'fill-box', transformOrigin: 'center center'
    });

    gsap.timeline({ scrollTrigger: { trigger: palier, start: 'top 62%', once: true } })
      .to(traits, {
        strokeDashoffset: 0,
        duration: 1.1,
        ease: 'power2.inOut',
        stagger: .06
      })
      .to(accents, {
        opacity: 1, scale: 1,
        duration: .4, ease: 'expo.out', stagger: .09
      }, '-=.35');
  });
}
