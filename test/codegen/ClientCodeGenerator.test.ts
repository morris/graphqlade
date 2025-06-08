import { visit } from 'graphql';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { format } from 'prettier';
import {
  ClientCodeGenerator,
  GraphQLReader,
  NamedOperationDefinitionNode,
} from '../../src';

describe('The ClientCodeGenerator', () => {
  const reader = new GraphQLReader();

  it('should uplift __typename from fragment spreads', async () => {
    const schema = await reader.buildSchemaFromDir('examples/server/schema');
    const operations = await reader.parseDir('examples/client/operations');
    const generator: ClientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    let found: NamedOperationDefinitionNode | undefined;

    visit(operations, {
      OperationDefinition: (node) => {
        generator.assertNamedOperationDefinition(node);

        if (node.name?.value === 'Reviews2') {
          found = node;
        }
      },
    });

    assert(found);

    assert.deepStrictEqual(
      await format(generator.generateOperationDataType(found), {
        parser: 'typescript',
      }),
      `export type DReviews2 = {
  reviews?: Maybe<
    Array<
      | ({
          __typename: "BossReview";
        } & (FBaseReview2 & FBossReview2))
      | ({
          __typename: "LocationReview";
        } & FBaseReview2)
    >
  >;
};
`,
    );
  });

  it('should uplift __typename from inline fragments', async () => {
    const schema = await reader.buildSchemaFromDir('examples/server/schema');
    const operations = await reader.parseDir('examples/client/operations');
    const generator: ClientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    let found: NamedOperationDefinitionNode | undefined;

    visit(operations, {
      OperationDefinition: (node) => {
        generator.assertNamedOperationDefinition(node);

        if (node.name?.value === 'Reviews3') {
          found = node;
        }
      },
    });

    assert(found);

    assert.deepStrictEqual(
      await format(generator.generateOperationDataType(found), {
        parser: 'typescript',
      }),
      `export type DReviews3 = {
  reviews?: Maybe<
    Array<
      | ({
          __typename: "BossReview";
        } & ({} & {
          boss: {
            id: string;

            name: string;
          };
        }))
      | ({
          __typename: "LocationReview";
        } & {})
    >
  >;
};
`,
    );
  });

  it('should not uplift __typename if it is not requested', async () => {
    const schema = await reader.buildSchemaFromDir('examples/server/schema');
    const operations = await reader.parseDir('examples/client/operations');
    const generator: ClientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    let found: NamedOperationDefinitionNode | undefined;

    visit(operations, {
      OperationDefinition: (node) => {
        generator.assertNamedOperationDefinition(node);

        if (node.name?.value === 'Reviews4') {
          found = node;
        }
      },
    });

    assert(found);

    assert.deepStrictEqual(
      await format(generator.generateOperationDataType(found), {
        parser: 'typescript',
      }),
      `export type DReviews4 = {
  reviews?: Maybe<
    Array<
      | ({} & {
          boss: {
            id: string;

            name: string;
          };
        } & FBaseReview4)
      | ({} & FBaseReview4)
    >
  >;
};
`,
    );
  });

  it('should only uplift __typename for possible types where it is requested', async () => {
    const schema = await reader.buildSchemaFromDir('examples/server/schema');
    const operations = await reader.parseDir('examples/client/operations');
    const generator: ClientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    let found: NamedOperationDefinitionNode | undefined;

    visit(operations, {
      OperationDefinition: (node) => {
        generator.assertNamedOperationDefinition(node);

        if (node.name?.value === 'Reviews5') {
          found = node;
        }
      },
    });

    assert(found);

    assert.deepStrictEqual(
      await format(generator.generateOperationDataType(found), {
        parser: 'typescript',
      }),
      `export type DReviews5 = {
  reviews?: Maybe<
    Array<
      | ({
          __typename: "BossReview";
        } & {
          boss: {
            id: string;

            name: string;
          };
        } & FBaseReview5)
      | ({} & FBaseReview5)
    >
  >;
};
`,
    );
  });
});
