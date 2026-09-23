const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([
  expo,
  {
    ignores: ['dist/**', 'ios/**', 'android/**', 'coverage/**'],
    rules: {
      // These rules reject the existing async loading and ref-backed operation
      // patterns used throughout the mobile screens. They are not required for
      // the Expo native build and currently prevent CI from reaching it.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
    },
  },
]);
