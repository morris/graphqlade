import { createServer } from 'http';
import { GraphQLServer } from '../dist/index.js';
import { resolvers } from './resolvers.mjs';

const gqlServer = await GraphQLServer.bootstrap({
  resolvers,
  createContext: (incoming) => {
    return incoming;
  },
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost:3000');

    if (url.pathname === '/graphql') {
      const response = await gqlServer.http.execute({
        headers: req.headers,
        method: req.method,
        query: Object.fromEntries(url.searchParams.entries()),
      });

      for (const [name, value] of Object.entries(response.headers)) {
        res.setHeader(name, value);
      }
      res.statusCode = response.status;
      res.end(JSON.stringify(response.body));
    } else {
      res.statusCode = 404;
      res.end('Not found');
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    res.statusCode = 500;
    res.end('Internal server error');
  }
});

server.listen(3000);
