import { DocumentNode, Kind } from 'graphql';

export function cleanOperations(document: DocumentNode): DocumentNode {
  return {
    ...document,
    definitions: document.definitions.filter(
      (definition) =>
        definition.kind !== Kind.SCALAR_TYPE_DEFINITION &&
        definition.kind !== Kind.DIRECTIVE_DEFINITION,
    ),
  };
}
