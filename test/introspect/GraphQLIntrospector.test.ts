import assert from 'node:assert';
import { describe, it } from 'node:test';
import { GraphQLIntrospector } from '../../src';
import { requireExampleServer } from '../util';

describe('The GraphQLIntrospector', () => {
  const exampleServer = requireExampleServer();

  it('should be able to build a client schema from an introspection result (using node-fetch)', async () => {
    const { url } = await exampleServer;

    const introspector = new GraphQLIntrospector();

    const schema = await introspector.buildClientSchemaFromIntrospection(url, {
      authorization: 'Bearer of a ring',
    });

    assert.ok(schema.getType('Boss'));
  });
});
