import { dirname } from "path";
import { fileURLToPath } from "url";
import { gql2ts } from "../../dist/index.js"; // graphqlade in your app

gql2ts({
  root: dirname(fileURLToPath(import.meta.url)),
  server: true,
  stitching: true,
});
