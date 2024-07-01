import express from 'express';
import { GraphQLServer } from '../dist/index.js';
import { resolvers } from './resolvers.mjs';

const gqlServer = await GraphQLServer.bootstrap({
  resolvers,
  createContext: (incoming) => {
    return incoming;
  },
});

const app = express();

app.get('/graphql', gqlServer.http.expressHandler());
app.post('/graphql', express.json({}), gqlServer.http.expressHandler());

app.listen(3000);
