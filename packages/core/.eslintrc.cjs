/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["zerithdb-eslint-config"],
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
};
