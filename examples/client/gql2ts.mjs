import fetch from "node-fetch"; // only if your Node.js version does not have fetch
import { dirname } from "path";
import { fileURLToPath } from "url";
import { gql2ts } from "../../dist/index.js"; // graphqlade in your app

gql2ts({
  root: dirname(fileURLToPath(import.meta.url)),
  introspection: {
    url: "http://localhost:4000/graphql",
    fetch, // only if your Node.js version does not have fetch
  },
  client: true,
  scalarTypes: {
    Date: "string",
    DateTime: "string",
    Time: "string",
    UUID: "string",
    JSON: "any",
    ESNumber: "number | string",
  },
});
