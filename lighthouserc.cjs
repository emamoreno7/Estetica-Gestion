// Primera ejecución: registrar la línea de base; umbrales iniciales sólo advertencias.
module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4173/Estetica-Gestion/'],
      numberOfRuns: 1,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 1.5, disabled: false },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.70 }],
        'categories:accessibility': ['warn', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.90 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-results' },
  },
};
