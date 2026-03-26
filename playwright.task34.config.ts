import baseConfig from "./playwright.config";

const task34Config = {
  ...baseConfig,
  webServer: undefined,
  use: {
    ...baseConfig.use,
    baseURL: "http://127.0.0.1:3001",
  },
};

export default task34Config;
