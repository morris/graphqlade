import {
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
} from "graphql";
import { parseDirective } from "./parseDirective";

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
