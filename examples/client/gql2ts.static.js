/* eslint-disable @typescript-eslint/no-var-requires */
const { gql2ts } = require("../../dist"); // graphqlade in your app

gql2ts({
  root: __dirname,
  schema: "../server/schema",
  client: true,
  scalarTypes: {
    UUID: "string",
    JSON: "any",
    ESNumber: "number",
  },
});
