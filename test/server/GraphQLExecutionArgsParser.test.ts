import { parse, print } from 'graphql';
import { GraphQLExecutionArgsParser } from '../../src';

describe('The GraphQLExecutionArgsParser', () => {
  it('should be able to parse a basic query', async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = '{ praise }';
    const args = gqlExecutionArgsParser.parse({ query });

    expect(print(args.document)).toEqual(print(parse(query)));
    expect(args.operationName).toBeUndefined();
    expect(args.variableValues).toBeUndefined();
  });

  it('should be able to parse a query with variables', async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser();

    const query = 'query Foo($baz: String!) { foo(bar: $baz) }';
    const args = gqlExecutionArgsParser.parse({
      query,
      variables: { baz: 'test' },
    });

    expect(print(args.document)).toEqual(print(parse(query)));
    expect(args.operationName).toBeUndefined();
    expect(args.variableValues).toEqual({ baz: 'test' });
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

    expect(print(args.document)).toEqual(print(parse(query)));
    expect(args.operationName).toEqual('Foo');
    expect(args.variableValues).toEqual({ baz: 'test' });
  });

  it('should respect maxTokens', async () => {
    const gqlExecutionArgsParser = new GraphQLExecutionArgsParser({
      maxTokens: 3,
    });

    gqlExecutionArgsParser.parse({ query: '{ praise }' });

    expect(() =>
      gqlExecutionArgsParser.parse({ query: '{ dont praise }' }),
    ).toThrow();
  });
});
