/** @type {import('@lhci/cli').UserConfig} */
module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready in",
      startServerReadyTimeout: 30000,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/adesao",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless --disable-gpu",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.8 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.8 }],
        "categories:seo": ["warn", { minScore: 0.7 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
