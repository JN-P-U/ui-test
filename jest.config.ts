import type { Config } from "jest";

const config: Config = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react-jsx" } }],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.css$": "<rootDir>/app/ui-test/__mocks__/styleMock.js",
    "^html-to-image$": "<rootDir>/app/ui-test/__mocks__/htmlToImage.js",
    "^next/navigation$": "<rootDir>/app/ui-test/__mocks__/nextNavigation.js",
  },
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  testMatch: ["**/app/ui-test/__tests__/**/*.test.{ts,tsx}"],
};

export default config;
