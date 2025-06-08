import { execute, GraphQLResolveInfo, parse } from 'graphql';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { CustomResolvers, getProjection, GraphQLServer } from '../../src';

describe('The getProjection function', () => {
  it('should calculate a projection from GraphQLResolveInfo', async () => {
    const gqlServer = await GraphQLServer.bootstrap<undefined>({
      root: `${__dirname}/../../examples/server`,
      createContext() {
        return undefined;
      },
    });

    const projections: Record<string, boolean>[] = [];

    gqlServer.setResolvers({
      Query: {
        reviews(
          _: unknown,
          __: unknown,
          ___: unknown,
          info: GraphQLResolveInfo,
        ) {
          projections.push(getProjection(info));

          return [{ id: 'fake' }];
        },
      },
      BossReview: {
        __isTypeOf() {
          return true;
        },
        boss(_: unknown, __: unknown, ___: unknown, info: GraphQLResolveInfo) {
          projections.push(
            getProjection(info, { name: { otherName: true, stuff: true } }),
          );

          return { name: 'big bo$$' };
        },
      },
    } as CustomResolvers<undefined>);

    await execute({
      schema: gqlServer.schema,
      document: parse(`{
        reviews {
          id
          author
          ... on BossReview {
            boss {
              name
            }
          }
        }
      }`),
    });

    await execute({
      schema: gqlServer.schema,
      document: parse(`
        {
          reviews {
            ...Things
          }
        }

        fragment Things on Review {
          id
          ... on BossReview {
            boss {
              id
              name
            }
          }
        }`),
    });

    assert.deepStrictEqual(projections, [
      { id: true, author: true, boss: true },
      { otherName: true, stuff: true },
      { id: true, boss: true },
      { id: true, otherName: true, stuff: true },
    ]);
  });
});
