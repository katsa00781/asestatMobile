// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // A core/ a webprojekt lib/-jének generált tükre – nem szerkeszthető,
    // ezért nem is lintelhető. Javítás mindig a webprojektben.
    ignores: ['dist/*', 'core/*', 'docs/mockups/*'],
  },
]);
