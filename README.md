# SÈVE · *Bois Dormant*

Landing page produit unique pour un parfum de niche. HTML, CSS et JavaScript
vanilla. Aucun framework, aucune photographie : tout est vectoriel ou
typographique.

Premier projet vitrine du studio **Pineapple Effect**, dont la signature est
de faire des sites qui se regardent comme des films.

> **SÈVE est un client fictif.** La marque, le parfum, les prix et l'adresse
> de contact sont inventés pour les besoins de la démonstration. Les
> contraintes techniques, elles, sont réelles, et les chiffres cités plus bas
> sont mesurés.

---

## Le concept

**La page s'assombrit à mesure qu'on descend.**

On entre dans la lumière : notes de tête, agrumes, craie pâle. On finit dans
l'ombre : notes de fond, vétiver, écorce presque noire. Le scroll n'est pas
une navigation, c'est la pyramide olfactive parcourue de haut en bas.

Tout le reste en découle. Une décision qui ne sert pas cette idée sort.

## La règle qui prime sur les autres

Un film d'action n'est pas un film où tout bouge tout le temps. L'explosion
n'a de force que parce que les trois plans qui précèdent étaient calmes.

La page suit donc une **courbe d'intensité**, pas une accumulation d'effets :

```
intensité
   ▲
   │ ██                              ██
   │ ██        ▄▄                    ██
   │ ██   ▄▄  ████    ▁▁▁▁▁         ████
   │ ██  ████ ████   ▁▁▁▁▁▁▁       ██████
   └──────────────────────────────────────▶ scroll
    SIG  HERO FLACON  PYRAMIDE  ATELIER  ACHAT
     ↑                    ↑        ↑       ↑
   impact             montée    SILENCE  impact
```

La section ATELIER ne porte **qu'une seule animation**, un fondu montant de
20 px. Elle paraît vide, et c'est le but : sans ce silence, la section ACHAT
ne pèse rien.

---

## Lancer le projet

```bash
npm install --prefix seve
```

```bash
npm run dev --prefix seve
```

Puis `npm run build --prefix seve` pour la version de production.

## Pile technique

`Vite` · `HTML/CSS/JS vanilla` · `Lenis` · `GSAP + ScrollTrigger` · `SVG inline`

Pas de React : une landing à cinq sections n'a aucun état à gérer, et le
framework coûterait 40 Ko pour rien. Pas de Three.js : tout l'effet cinéma
passe par du SVG, des filtres CSS et GSAP.

```
seve/
├── index.html
├── copy.md                  la copy validée, mesurée sur 62 caractères
├── public/fonts/            Archivo + Newsreader, woff2 sous-ensemblés
└── src/
    ├── main.js              lit les tokens, distribue, joue la signature
    ├── signature.js         autonome, paramétrable, réutilisable
    ├── pyramide.js          interpolation des couleurs au scroll
    ├── flacon.js            isolé, remplaçable par du Blender plus tard
    ├── velocite.js          flou de vitesse
    └── styles/
        ├── tokens.css       source de vérité unique
        ├── base.css
        └── sections.css
```

---

## Le cœur technique : la bande morte

La section PYRAMIDE interpole le fond en continu, du grège `--limon` à
l'écorce `--ecorce`. Le piège est au milieu, et il est arithmétique.

Entre une luminance relative de fond de **0,1339 et 0,2326**, aucune couleur
de la palette n'atteint 4,5:1. Ni le texte sombre, ni le texte clair. Ce
n'est pas un réglage à affiner : sur un gris moyen, le maximum théorique est
d'environ 4,6:1 et il faut du noir ou du blanc pur pour l'atteindre.

Avec une interpolation naïve où le fond et le texte glissent ensemble, le
texte disparaît littéralement à mi-course :

```
t=0.0   fond #a8a091   texte #221d17    6,45:1   ok
t=0.2   fond #8d8679   texte #4a453e    2,63:1
t=0.4   fond #726c60   texte #726d64    1,01:1   invisible
t=0.6   fond #585148   texte #99948b    2,59:1
t=1.0   fond #221d17   texte #e9e4d8   13,18:1   ok
```

**La réponse retenue :** le fond glisse en continu, mais le texte bascule.
Chaque palier tient sa couleur pleine sous son bloc de texte et ne descend
vers le suivant que dans son dernier septième. La bande morte est ainsi
traversée vite, et pendant qu'aucun bloc n'est en zone de lecture.

Personne ne perçoit que les deux courbes ne sont pas synchrones. Tout le
monde perçoit un texte illisible.

Cinq seuils, tous calculés et inscrits dans `tokens.css` :

| seuil | valeur | ce qu'il commande |
|---|---|---|
| `--seuil-texte-sombre` | 0,2326 | `--ecorce` lisible tant que L(fond) ≥ ceci |
| `--seuil-texte-clair` | 0,1339 | `--craie` lisible dès que L(fond) ≤ ceci |
| `--seuil-matiere-tete` | 0,3251 | `--seve-txt` ne tient que sur `--limon` pur |
| `--seuil-matiere-fond` | 0,0421 | le plus exigeant, il commande la révélation de FOND |
| `--seuil-bascule-corps` | 0,1780 | point d'égalité `--ecorce` / `--craie` |

Une conséquence non intuitive : **aucun vert n'est lisible sur le palier du
milieu.** Le maximum atteignable y est 6,12:1 avec du noir pur, et un
`--seve` assombri à 50 % plafonne à 4,47:1. Les noms de matières y perdent
donc leur accent coloré et se distinguent par la typographie.

---

## La signature

`src/signature.js` est un module **totalement autonome**. Il ne lit aucun
token, ne touche à aucun élément de la page, ne suppose l'existence de rien.
Copié seul dans une page vide, il fonctionne.

```js
import { playSignature, playWipe } from './signature.js';

await playSignature({
  peau:  '#B4622B',   // l'écorce de l'ananas
  chair: '#E9E4D8',   // l'intérieur révélé par les lames
  fond:  '#221D17'    // le noir du rideau
});
```

Six plans : amorce, impact avec overshoot et shake, suspension avec balayage,
tranchage au ralenti, éjection avec flou directionnel, révélation.

C'est une **chorégraphie, pas une palette**. Recolorisée ici en résine et
craie, sans une trace d'or : un prospect doit comprendre qu'il aura sa
propre version.

Comme le module ne peut pas lire `tokens.css` sans perdre son indépendance,
c'est `main.js` qui lit les tokens via `getComputedStyle` et les lui passe en
paramètres. Les deux règles tiennent ensemble par ce seul point.

### Le wipe de montage

Les trois tranches redeviennent trois bandes diagonales qui balayent l'écran.
Même geste, mais au service de la navigation : c'est ce qui transforme la
signature d'un péage à l'entrée en outil narratif.

Les trois marques du rail le déclenchent. Le saut tombe pendant que l'écran
est **couvert**, sinon on verrait la page changer et l'illusion de montage
s'effondrerait. La fenêtre est étroite : les bandes achèvent de couvrir à
0,55 s et repartent à 0,60 s, le saut est donc programmé à 0,57 s.

Il passe par `gsap.delayedCall` et non par `setTimeout`, parce qu'il partage
alors le ticker du wipe : si le navigateur bégaie, les deux ralentissent
ensemble au lieu de se désynchroniser.

Sans JavaScript, les marques restent de simples ancres et sautent
nativement. La navigation ne dépend jamais de l'animation.

---

## Typographie

Deux familles, et l'inversion est délibérée : **le sérif est la matière
lisible, le display est un grotesque massif.** C'est l'inverse du réflexe
« parfum de luxe = Didot italique ».

- **Archivo** : titres, labels, noms de matières, bouton
- **Newsreader** : corps de texte, poids 300, interligne 1,8

Auto-hébergées, sous-ensemblées sur les glyphes réellement composés :
**56,4 Ko** au total, contre 114,8 pour le sous-ensemble latin complet.
L'italique est réduit à ses deux seules chaînes réelles.

> Conséquence à connaître : modifier la copy peut demander de régénérer les
> polices si un glyphe absent apparaît.

Archivo et Newsreader sont sous licence SIL Open Font License.

---

## Chiffres mesurés

| poste | mesure |
|---|---|
| contraste, pyramide | 401 positions de scroll auditées, **1 résidu** (voir ci-dessous) |
| contraste, hors pyramide | 0 incident, de 390 à 1440 px |
| JS | 57,9 Ko gzip (budget 90) |
| premier rendu | environ 120 Ko, polices comprises (budget 250) |
| polices | 56,4 Ko (budget 60) |
| débordement horizontal | aucun, à toutes les largeurs |

Les contrastes sont vérifiés **par le calcul contre le fond réellement
peint**, dégradés et interpolation compris, pas à l'œil.

Le résidu est déclaré plutôt que masqué : sur 401 positions, une seule voit
le paragraphe du CŒUR à 4,38:1. Elle survient au moment précis où la
traversée s'amorce, alors que ce paragraphe a son bas à 184 px du haut de
l'écran et sort du champ. La zone de lecture retenue pour l'audit va de 20 à
80 % de la hauteur du viewport : le paragraphe la quitte à quatre pixels
près. Rétrécir cette zone ferait tomber le chiffre à zéro, ce qui reviendrait
à déplacer la cible plutôt qu'à corriger quoi que ce soit.

Les seuils s'arrondissent **toujours du côté sûr**, jamais au plus proche :
un minimum vers le haut, un maximum vers le bas. Arrondi au plus proche,
`--seuil-texte-sombre` valait 0,2326 pour un exact de 0,232630, et le corps
de texte tombait à 4,4998:1. Invisible à l'œil, faux au calcul.

## Accessibilité

- La page reste lisible et complète **avec JavaScript désactivé**. Le CSS de
  base ne dépend pas de GSAP.
- `prefers-reduced-motion` : signature remplacée par un fondu de 0,3 s,
  révélation mot à mot remplacée par un fondu simple, dérive du flacon et
  flou de vitesse coupés.
- Le rideau de la signature est `aria-hidden`, sans élément focusable : il ne
  piège jamais le focus clavier. Le calque du wipe non plus.
- Le rail est un `<nav>` étiqueté, et ses trois marques sont de vrais liens :
  accessibles au clavier, annoncés, et fonctionnels sans JavaScript. Seuls la
  piste et le remplissage restent `aria-hidden`, puisqu'ils ne sont que des
  tracés. Un rail cliquable qui resterait masqué aux lecteurs d'écran serait
  une faute bien pire que le rail décoratif qu'il remplace.
- Un seul `h1`, hiérarchie de titres sans saut de niveau.
- Les capitales sont produites par `text-transform`, jamais saisies en dur :
  les lecteurs d'écran n'épellent pas les mots.

---

## Points ouverts

- **Le rail est devenu une navigation.** Le brief le décrivait comme le seul
  élément décoratif autorisé, et interdisait tout menu. Rendre ses marques
  cliquables était la seule façon de déclencher le wipe, que le même brief
  exigeait de réutiliser. L'arbitrage a été fait en faveur du wipe, en
  connaissance de cause : trois liens contextuels vers une séquence ordonnée
  ne sont pas un menu de navigation, mais la frontière est mince.
- **Licence du code** à choisir. Seules les polices ont la leur.

## Crédits

Studio **Pineapple Effect**. Développement assisté par Claude Opus 5.
