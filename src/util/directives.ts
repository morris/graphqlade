import {
  DirectiveNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  FieldDefinitionNode,
  FieldNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  InlineFragmentNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
  OperationDefinitionNode,
  ScalarTypeDefinitionNode,
  SchemaDefinitionNode,
  UnionTypeDefinitionNode,
  valueFromASTUntyped,
} from "graphql";

export function getDirective<T>(
  node: // ExecutableDirectiveLocation:
  | OperationDefinitionNode
    | FieldNode
    | FragmentDefinitionNode
    | FragmentSpreadNode
    | InlineFragmentNode
    // TypeSystemDirectiveLocation:
    | SchemaDefinitionNode
    | ScalarTypeDefinitionNode
    | ObjectTypeDefinitionNode
    | FieldDefinitionNode
    | InterfaceTypeDefinitionNode
    | UnionTypeDefinitionNode
    | EnumTypeDefinitionNode
    | EnumValueDefinitionNode
    | InputObjectTypeDefinitionNode
    | InputValueDefinitionNode,
  name: string
): T | undefined {
  const directiveNode = node.directives?.find((it) => it.name.value === name);

  if (directiveNode) return parseDirective(directiveNode);
}

export function parseDirective<T>(node: DirectiveNode): T {
  const directive: Record<string, unknown> = {};

  for (const arg of node.arguments ?? []) {
    directive[arg.name.value] = valueFromASTUntyped(arg.value);
  }

  return directive as T;
}
