import { makeExecutableSchema } from '@graphql-tools/schema';
import { readFileSync } from 'fs';
import { createYoga } from 'graphql-yoga';
import { createServer } from 'http';
import { resolvers } from './resolvers.mjs';

export const schema = makeExecutableSchema({
  resolvers: [resolvers],
  typeDefs: [readFileSync('schema/schema.gql', 'utf-8')],
});

const yoga = createYoga({ schema });
const server = createServer(yoga);

server.listen(3000);
