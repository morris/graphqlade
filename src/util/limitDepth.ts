import { DocumentNode, visit } from "graphql";

export function limitDepth(document: DocumentNode, maxDepth: number) {
  function traverse(currentDepth: number, fragmentSpreads: string[]) {
    if (fragmentSpreads.some((f, i) => i !== fragmentSpreads.indexOf(f))) {
      throw new TypeError("Invalid query, contains circular fragment spreads");
    }

    visit(document, {
      OperationDefinition() {
        if (fragmentSpreads.length > 0) {
          return false;
        }
      },
      FragmentDefinition(fragmentDefinitionNode) {
        if (
          fragmentDefinitionNode.name.value !==
          fragmentSpreads[fragmentSpreads.length - 1]
        ) {
          return false;
        }
      },
      Field: {
        enter() {
          ++currentDepth;

          if (currentDepth > maxDepth) {
            throw new TypeError("Invalid query, exceeds max depth");
          }
        },
        leave() {
          --currentDepth;
        },
      },
      FragmentSpread(fragmentSpread) {
        traverse(currentDepth, [...fragmentSpreads, fragmentSpread.name.value]);
      },
    });
  }

  traverse(-1, []);
}
