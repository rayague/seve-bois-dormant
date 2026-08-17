import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

/**
 * Deux points d'entrée. Le second produit dist/404.html, que Vercel sert
 * automatiquement sur toute URL inconnue. Le passer par Vite plutôt que par
 * public/ lui donne les mêmes feuilles de style hachées que le reste du
 * site : la page d'erreur n'est pas un orphelin, elle fait partie du projet.
 */
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        404:   fileURLToPath(new URL('./404.html', import.meta.url))
      }
    }
  }
});
