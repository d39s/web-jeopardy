export default {
  '*.{ts,tsx}': ['eslint --max-warnings=0 --no-warn-ignored', 'prettier --write'],
  '*.{js,json,css,md,yml,yaml}': ['prettier --write'],
  // Fragensets immer vollständig prüfen (Index-Konsistenz), daher ohne Dateiliste.
  'content/topics/*.json': () => 'npm run validate:content',
};
