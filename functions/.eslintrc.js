module.exports = {
  root: true,

  env: {
    es2022: true,
    node: true,
  },

  extends: [
    'eslint:recommended',
    'google',
  ],

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },

  rules: {
    'linebreak-style': 'off',
    'require-jsdoc': 'off',
  },
};
