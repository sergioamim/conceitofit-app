import baseConfig from "./playwright.config";

const task34Config = {
  ...baseConfig,
  webServer: undefined,
  use: {
    ...baseConfig.use,
    baseURL: "http://localhost:3001",
  },
};

export default task34Config;
