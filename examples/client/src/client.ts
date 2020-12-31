import { AbstractClient } from "./generated/operations";
import { GraphQLWebSocketClient } from "graphqlade/dist/browser";

export class MyClient extends AbstractClient {
  protected socketClient: GraphQLWebSocketClient;

  constructor() {
    super();

    this.socketClient = new GraphQLWebSocketClient({
      url: "ws://localhost:4000/graphql",
      protocol: "graphql-ws-transport",
    });
  }

  // implement raw query method to be used by the generated methods
  async query<TVariables, TExecutionResult>(
    query: string,
    operationName: string,
    variables: TVariables
  ): Promise<TExecutionResult> {
    return fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        operationName,
        variables,
      }),
    }).then((r) => r.json());
  }

  subscribe<TVariables, TExecutionResult>(
    query: string,
    operationName: string,
    variables: TVariables
  ) {
    return this.socketClient.subscribe<TExecutionResult>({
      query,
      operationName,
      variables: variables as Record<string, unknown>,
    });
  }
}
