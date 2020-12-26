import { DocumentNode, visit } from "graphql";

export function cleanOperations(document: DocumentNode) {
  return visit(document, {
    ScalarTypeDefinition() {
      return null;
    },
    DirectiveDefinition() {
      return null;
    },
  });
}
