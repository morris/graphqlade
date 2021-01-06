module.exports = {
  require: [
    "./node_modules/ts-node/register",
    "./node_modules/source-map-support/register",
  ],
  extension: ["ts", "js"],
  recursive: true,
  timeout: 3000,
  exit: true,
};
