module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@core': './core',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      // A react-native-worklets/plugin-t a babel-preset-expo automatikusan
      // hozzáadja, ha a csomag telepítve van – itt nem kell felsorolni.
    ],
  };
};
