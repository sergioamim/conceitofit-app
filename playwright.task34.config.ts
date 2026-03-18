import baseConfig from "./playwright.config";

export default {
  ...baseConfig,
  webServer: undefined,
  use: {
    ...baseConfig.use,
    baseURL: "http://127.0.0.1:3001",
  },
};
