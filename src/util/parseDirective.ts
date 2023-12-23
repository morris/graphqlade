import { DirectiveNode, valueFromASTUntyped } from 'graphql';

export function parseDirective<T>(node: DirectiveNode): T {
  const directive: Record<string, unknown> = {};

  for (const arg of node.arguments ?? []) {
    directive[arg.name.value] = valueFromASTUntyped(arg.value);
  }

  return directive as T;
}
