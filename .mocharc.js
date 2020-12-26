module.exports = {
  require: [
    "./node_modules/ts-node/register",
    "./node_modules/source-map-support/register",
  ],
  extension: ["ts"],
  recursive: true,
  timeout: 9999,
  exit: true,
};
