import type { ExecutionResult } from "graphql";
import { GraphQLWebSocketClient } from "graphqlade/dist/browser";
import {
  MutationName,
  OperationNameToData,
  OperationNameToDocument,
  OperationNameToVariables,
  QueryName,
  SubscriptionName,
} from "./generated/operations";

export class MyClient {
  protected socketClient: GraphQLWebSocketClient;

  constructor() {
    this.socketClient = new GraphQLWebSocketClient({
      url: "ws://localhost:4000/graphql",
      connectionInitPayload: {
        keys: ["MASTER_KEY"],
      },
    });
  }

  async query<TQueryName extends QueryName>(
    operationName: TQueryName,
    variables: OperationNameToVariables[TQueryName]
  ): Promise<ExecutionResult<OperationNameToData[TQueryName]>> {
    return fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: OperationNameToDocument[operationName],
        operationName,
        variables,
      }),
    }).then((r) => r.json());
  }

  async mutate<TMutationName extends MutationName>(
    operationName: TMutationName,
    variables: OperationNameToVariables[TMutationName]
  ): Promise<ExecutionResult<OperationNameToData[TMutationName]>> {
    return fetch("http://localhost:4000/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: OperationNameToDocument[operationName],
        operationName,
        variables,
      }),
    }).then((r) => r.json());
  }

  subscribe<TSubscriptionName extends SubscriptionName>(
    operationName: SubscriptionName,
    variables: OperationNameToVariables[TSubscriptionName]
  ) {
    return this.socketClient.subscribe<
      ExecutionResult<OperationNameToData[TSubscriptionName]>
    >({
      query: OperationNameToDocument[operationName],
      operationName,
      variables: variables as Record<string, unknown>,
    });
  }
}
