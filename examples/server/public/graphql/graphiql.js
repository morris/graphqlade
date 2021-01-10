import {
  parse,
  getOperationAST,
} from "https://unpkg.com/graphql@15.4.0/index.mjs";

ReactDOM.render(
  React.createElement(GraphiQL, {
    fetcher: graphiqlFetcher,
  }),
  document.getElementById("graphiql")
);

const gqlWsClient = new graphqlade.GraphQLWebSocketClient({
  url: "ws://localhost:4000/graphql",
  connectionInitPayload: {
    keys: ["MASTER_KEY"],
  },
  autoReconnect: false,
});

async function graphiqlFetcher(params) {
  const ast = parse(params.query);
  const operation = getOperationAST(ast, params.operationName);

  if (operation.operation === "subscription") {
    return gqlWsClient.subscribe(params);
  }

  const r = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  try {
    const json = await r.json();

    return json;
  } catch (err) {
    const text = await r.text();

    return text;
  }
}
