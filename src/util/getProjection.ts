import type {
  FieldNode,
  FragmentDefinitionNode,
  GraphQLResolveInfo,
  InlineFragmentNode,
} from 'graphql';

export function getProjection(
  info: GraphQLResolveInfo,
  overrides?: Record<string, Record<string, boolean>>,
) {
  const projection: Record<string, boolean> = {};

  traverse(info.fieldNodes[0]);

  function traverse(
    context: FieldNode | InlineFragmentNode | FragmentDefinitionNode,
  ) {
    context.selectionSet?.selections.forEach((node) => {
      if (node.kind === 'Field') {
        const o = overrides?.[node.name.value];

        if (o) {
          Object.assign(projection, o);
        } else {
          projection[node.name.value] = true;
        }
      } else if (node.kind === 'InlineFragment') {
        traverse(node);
      } else if (node.kind === 'FragmentSpread') {
        traverse(info.fragments[node.name.value]);
      }
    });
  }

  return projection;
}
