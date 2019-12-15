module.exports = {
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    "/node_modules",
    "/node_modules.linux/",
    "/node_modules.mac/"
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  modulePathIgnorePatterns: [
    "npm-cache",
    ".npm",
    "node_modules",
    "node_modules.mac",
    "node_modules.linux"
  ],
  roots: ["<rootDir>/src", "<rootDir>/test"],
  testPathIgnorePatterns: [
    "/lib/",
    "/node_modules/",
    "/node_modules.mac/",
    "/node_modules.linux/",
    "/src/test-helpers"
  ],
  transform: {
    "^.+\\.test.ts?$": "ts-jest"
  },
  preset: "ts-jest"
};
