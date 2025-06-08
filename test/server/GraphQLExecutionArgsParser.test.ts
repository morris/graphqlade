import { parse, print } from 'graphql';
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { GraphQLExecutionArgsParser } from '../../src';

describe('The GraphQLExecutionArgsParser', () => {
  it('should be able to parse a basic query', async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = '{ praise }';
    const args = gqlExecutionArgsParser.parse({ query });

    assert.deepStrictEqual(print(args.document), print(parse(query)));
    assert.deepStrictEqual(args.operationName, undefined);
    assert.deepStrictEqual(args.variableValues, undefined);
  });

  it('should be able to parse a query with variables', async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = 'query Foo($baz: String!) { foo(bar: $baz) }';
    const args = gqlExecutionArgsParser.parse({
      query,
      variables: { baz: 'test' },
    });

    assert.deepStrictEqual(print(args.document), print(parse(query)));
    assert.deepStrictEqual(args.operationName, undefined);
    assert.deepStrictEqual(args.variableValues, { baz: 'test' });
  });

  it('should be able to parse a named query with variables', async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = `
      query Foo($baz: String!) { foo(bar: $baz) }
      mutation Ignored { mutate }
    `;
    const args = gqlExecutionArgsParser.parse({
      query,
      variables: { baz: 'test' },
      operationName: 'Foo',
    });

    assert.deepStrictEqual(print(args.document), print(parse(query)));
    assert.deepStrictEqual(args.operationName, 'Foo');
    assert.deepStrictEqual(args.variableValues, { baz: 'test' });
  });

  it('should respect maxTokens', async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser({
      maxTokens: 3,
    });

    gqlExecutionArgsParser.parse({ query: '{ praise }' });

    assert.throws(() =>
      gqlExecutionArgsParser.parse({ query: '{ dont praise }' }),
    );
  });
});
