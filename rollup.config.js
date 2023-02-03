export default {
  input: "./src/simple-yenc.js",
  output: [
    {
      file: "dist/esm.js",
      format: "esm",
    },
    {
      file: "dist/index.js",
      format: "cjs",
    },
  ],
};
