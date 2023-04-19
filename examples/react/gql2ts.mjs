import { dirname } from "path";
import { fileURLToPath } from "url";
import { gql2ts } from "graphqlade";

gql2ts({
  root: dirname(fileURLToPath(import.meta.url)),
  schema: "../server/schema",
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
