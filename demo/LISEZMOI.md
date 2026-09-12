# Les vidéos de démonstration

Trois captures du site, filmées en descendant lentement la page avec une pause
à chaque section.

| Fichier | Poids | Usage |
|---|---:|---|
| `seve-bois-dormant.webm` | 9 Mo | la version longue, pour le web |
| `seve-bois-dormant.mp4` | 2 Mo | le repli, pour ce qui ne lit pas le WebM |
| `seve-court-18s.webm` | 3 Mo | dix-huit secondes, pour un message ou un profil |

**Aucune page du site ne les sert.** Elles servent à montrer le projet
ailleurs — un lien, un message, un portfolio.

## Pourquoi elles sont ici et pas dans `medias/`

`medias/` est hors git, et à juste titre : il pèse 347 Mo, dont 195 de binaires
`ffmpeg` et 1 864 images intermédiaires. Tout cela se régénère ou se
retélécharge.

Ces trois fichiers-là, non — pas à l'identique. Les refaire demande de
relancer la capture et l'encodage, et le rendu ne sera pas le même à l'octet
près. Quatorze mégaoctets versionnés valent mieux qu'une reprise.

## Les refaire

Les outils sont dans le carnet, sous `sondes/capture/` :

```bash
node filmer.cjs  https://…  ./images
node encoder.cjs ./images    sortie.mp4
```
