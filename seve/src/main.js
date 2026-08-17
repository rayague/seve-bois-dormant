/**
 * ============================================================================
 * SÈVE, main.js
 * ----------------------------------------------------------------------------
 * Chef d'orchestre. Il lit les tokens, démarre le scroll, distribue aux
 * modules, et joue la signature en dernier.
 *
 * C'est aussi le seul endroit qui connaît à la fois tokens.css et
 * signature.js : le module de signature est autonome par conception et ne
 * lit aucun token, donc c'est main.js qui les lui passe en paramètres.
 * Les deux règles : « aucun hexadécimal hors de tokens.css » et « le module
 * ne suppose l'existence de rien », tiennent ensemble par ce seul point.
 * ============================================================================
 */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { playSignature, playWipe } from './signature.js';
import { initPyramide, luminance, versRGB } from './pyramide.js';
import { initFlacon } from './flacon.js';
import { initVelocite } from './velocite.js';

gsap.registerPlugin(ScrollTrigger);

const racine = document.documentElement;
racine.classList.add('js');

const REDUIT = matchMedia('(prefers-reduced-motion: reduce)').matches;


/* ═══════════════════════════════════════════════════════════════ tokens */

const cs = getComputedStyle(racine);
const jeton = n => cs.getPropertyValue(n).trim();

const TOKENS = {
  craie:     jeton('--craie'),
  limon:     jeton('--limon'),
  ecorce:    jeton('--ecorce'),
  fondTete:  jeton('--limon'),
  fondCoeur: jeton('--fond-coeur'),
  fondBas:   jeton('--ecorce'),
  seve:      jeton('--seve'),
  resine:    jeton('--resine'),
  seveTxt:      jeton('--seve-txt'),
  resineTxt:    jeton('--resine-txt'),
  matiereCoeur: jeton('--matiere-coeur')
};

const SEUILS = {
  texteSombre:  parseFloat(jeton('--seuil-texte-sombre')),
  texteClair:   parseFloat(jeton('--seuil-texte-clair')),
  matiereFond:  parseFloat(jeton('--seuil-matiere-fond')),
  matiereTete:  parseFloat(jeton('--seuil-matiere-tete')),
  basculeCorps: parseFloat(jeton('--seuil-bascule-corps'))
};


/* ═══════════════════════════════════════════════════════════════ scroll */

const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
lenis.stop();                       // relâché à la fin de la signature

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add(t => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);


/* ═══════════════════════════════════════════════════ rail de progression
   Le remplissage suit le scroll. Les marques basculent de couleur avec
   l'ambiance de la section traversée : le rail est en position fixed, il
   croise les quatre fonds, et aucune couleur unique n'y tient à 4,5:1.   */

function initRail() {
  const rail = document.querySelector('.rail');
  if (!rail) return;

  const remplissage = rail.querySelector('.rail__remplissage');
  const marques = {
    tete:  rail.querySelector('.rail__marque--tete'),
    coeur: rail.querySelector('.rail__marque--coeur'),
    fond:  rail.querySelector('.rail__marque--fond')
  };
  const paliers = {
    tete:  document.querySelector('.palier--tete'),
    coeur: document.querySelector('.palier--coeur'),
    fond:  document.querySelector('.palier--fond')
  };
  const fondPyramide = document.querySelector('.pyramide__fond');
  const sections = Array.from(document.querySelectorAll('section[data-ambiance]'));

  const bureau = () => matchMedia('(min-width: 1140px)').matches;

  function ambiance() {
    const centre = innerHeight / 2;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (centre < r.top || centre > r.bottom) continue;
      if (s.dataset.ambiance !== 'dynamique') return s.dataset.ambiance;
      const c = getComputedStyle(fondPyramide).backgroundColor;
      return luminance(versRGB(c)) <= SEUILS.texteClair ? 'sombre' : 'clair';
    }
    return 'clair';
  }

  function actualiser() {
    const h = document.body.scrollHeight - innerHeight;
    const p = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;

    if (bureau()) remplissage.style.height = `${(p * 100).toFixed(2)}%`;
    else          remplissage.style.width  = `${(p * 100).toFixed(2)}%`;

    rail.dataset.ambiance = ambiance();

    const centre = innerHeight / 2;
    for (const [cle, el] of Object.entries(paliers)) {
      if (!el || !marques[cle]) continue;
      const r = el.getBoundingClientRect();
      marques[cle].classList.toggle('est-active', centre >= r.top && centre <= r.bottom);
    }
  }

  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: actualiser, onRefresh: actualiser });
  actualiser();

  /* ------------------------------------------------- wipe de montage
     Les trois tranches de la signature redeviennent trois bandes
     diagonales : le même geste, mais au service de la navigation. C'est ce
     qui transforme la signature d'un péage à l'entrée en outil narratif.

     Le saut doit tomber pendant que l'écran est COUVERT, sinon on voit la
     page changer et l'illusion de montage s'effondre. La fenêtre est
     étroite : les trois bandes achèvent de couvrir à 0,55 s (0,45 de
     course plus 0,10 de décalage) et repartent à 0,60. On vise 0,57.
     Ces valeurs sont celles de la timeline du module, qu'on ne touche pas.

     Sans JavaScript, les marques restent de simples ancres et sautent
     nativement : la navigation ne dépend pas de l'animation.            */

  const COUVERT = 0.57;
  let enTransition = false;

  const allerAu = (cible, hash) => {
    if (!cible || enTransition) return;

    const atterrir = () => {
      lenis.scrollTo(cible, { immediate: true });
      history.replaceState(null, '', hash);
      ScrollTrigger.refresh();
      enTransition = false;
    };

    if (REDUIT) { atterrir(); return; }

    enTransition = true;
    playWipe({ couleur: TOKENS.ecorce });
    gsap.delayedCall(COUVERT, atterrir);
  };

  Object.entries(marques).forEach(([cle, marque]) => {
    if (!marque) return;
    marque.addEventListener('click', evt => {
      evt.preventDefault();
      allerAu(paliers[cle], marque.getAttribute('href'));
    });
  });
}


/* ═══════════════════════════════════════════════════════ entrée du hero
   Deux lignes qui montent de 24 px, décalées de 90 ms, avec une aberration
   chromatique résorbée sur les 300 premières ms.

   Le mode de fusion suit la valeur du fond : le hero est sur --craie, donc
   multiply. En screen, sur un fond quasi blanc, les deux copies décalées
   sont écrasées vers le blanc et l'effet devient invisible.               */

let tracerFlaconHero = () => gsap.timeline();

function entreeHero() {
  const lignes = Array.from(document.querySelectorAll('.hero .ligne'));
  const flacon = document.querySelector('.hero__flacon');
  if (!lignes.length) return;

  if (REDUIT) {
    gsap.set([...lignes, flacon].filter(Boolean), { opacity: 1, y: 0 });
    return;
  }

  const fantomes = [];
  lignes.forEach(ligne => {
    const texte = ligne.querySelector('.ligne__texte');
    [TOKENS.resine, TOKENS.seve].forEach((couleur, i) => {
      const f = texte.cloneNode(true);
      f.classList.remove('ligne__texte');
      f.classList.add('fantome');
      f.setAttribute('aria-hidden', 'true');
      f.style.color = couleur;
      ligne.append(f);
      fantomes.push({ el: f, sens: i === 0 ? 1 : -1 });
    });
  });

  const tl = gsap.timeline();

  tl.fromTo(lignes,
    { yPercent: 26, opacity: 0 },
    { yPercent: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .09 }, 0);

  fantomes.forEach(({ el, sens }) => {
    tl.fromTo(el,
      { x: sens * 2, opacity: .85 },
      { x: 0, opacity: 0, duration: .3, ease: 'power2.out' }, 0);
  });

  tl.set(fantomes.map(f => f.el), { display: 'none' }, .32);

  /* Le flacon se trace pendant que les lignes montent, décalé de 250 ms.
     Un départ simultané ferait mécanique ; ce décalage fait vivant, et il
     laisse au titre le temps d'exister seul avant que le regard parte à
     droite. */
  tl.add(tracerFlaconHero(), .25);
}


/* ══════════════════════════════════════════════════════════ 04 · ATELIER
   Un fade-up de 20 px. Point final. Pas de parallaxe, pas de révélation
   mot à mot, pas de flou de vitesse. C'est le silence qui donne son poids
   à la section suivante.                                                  */

function initAtelier() {
  const atelier = document.querySelector('.atelier');
  if (!atelier) return;

  gsap.fromTo(atelier.children,
    { y: REDUIT ? 0 : 20, opacity: 0 },
    {
      y: 0, opacity: 1,
      duration: REDUIT ? .3 : .7,
      ease: 'power2.out',
      stagger: REDUIT ? 0 : .06,
      scrollTrigger: { trigger: atelier, start: 'top 72%', once: true }
    });
}


/* ═════════════════════════════════════════════════════════════ démarrage */

/* L'état de départ du hero est posé tout de suite, pas au moment de l'entrée :
   quand la signature est sautée (déjà vue dans la session), elle se résout
   après un fondu de 0,3 s et le hero serait visible avant de repartir en
   arrière. On évite le sursaut. */
if (!REDUIT) {
  gsap.set(document.querySelectorAll('.hero .ligne'), { yPercent: 26, opacity: 0 });
}

initRail();
initPyramide({ tokens: TOKENS, seuils: SEUILS, reduit: REDUIT });

/* initFlacon rend le tracé du hero au lieu de le jouer : il doit tomber
   dans la séquence d'entrée, pas derrière le rideau de la signature. */
({ tracerHero: tracerFlaconHero } = initFlacon({ reduit: REDUIT }));
initAtelier();
initVelocite({ lenis, reduit: REDUIT });

/* La page est déjà construite derrière : le HTML est statique, la signature
   ne fait que poser un calque par-dessus. Rien ne se compose après elle.  */
/* oncePerSession: false, la signature rejoue à CHAQUE rechargement.
   Le brief demandait l'inverse (une fois par session) pour ne pas imposer
   un péage au visiteur qui revient. Décision du studio, assumée : en phase
   de démonstration on veut la revoir à chaque fois. Elle reste sautable au
   premier scroll, clic, touche ou touchmove. */
/* duration: 4 au lieu de 2. On passe par le paramètre exposé par le module,
   qui applique un timeScale global : les six plans, leurs proportions et
   leurs easings restent strictement intacts, tout se joue simplement deux
   fois moins vite. La timeline n'est pas touchée. */
playSignature({
  chair: TOKENS.craie,
  peau:  TOKENS.resine,
  fond:  TOKENS.ecorce,
  oncePerSession: false,
  duration: 4
}).then(() => {
  lenis.start();
  entreeHero();
  ScrollTrigger.refresh();
});
