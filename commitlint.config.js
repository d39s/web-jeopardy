/** Conventional Commits – siehe docs/arbeitsplan.md, Kapitel 6. */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    'scope-enum': [
      2,
      'always',
      ['core', 'web', 'ui', 'content', 'docker', 'ci', 'docs', 'e2e', 'repo', ''],
    ],
  },
};
