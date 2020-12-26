/* eslint-disable @typescript-eslint/no-var-requires */
const got = require("got");
const { gql2ts } = require("../.."); // graphqlade in your app

gql2ts({
  root: __dirname,
  introspection: {
    url: "http://localhost:4000/graphql",
    request: got,
  },
  client: true,
});
