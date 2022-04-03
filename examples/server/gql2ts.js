/* eslint-disable @typescript-eslint/no-var-requires */
const { gql2ts } = require("../.."); // graphqlade in your app

gql2ts({
  root: __dirname,
  server: true,
});
