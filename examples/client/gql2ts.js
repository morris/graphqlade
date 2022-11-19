/* eslint-disable @typescript-eslint/no-var-requires */
const { gql2ts } = require("../.."); // graphqlade in your app
const fetch = require("node-fetch");

gql2ts({
  root: __dirname,
  introspection: { url: "http://localhost:4000/graphql", fetch },
  client: true,
  scalarTypes: {
    UUID: "string",
    JSON: "any",
    ESNumber: "number",
  },
});
