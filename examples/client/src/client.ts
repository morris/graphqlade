import { AbstractClient } from "./generated/operations";

export class MyClient extends AbstractClient {
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

  /*subscribe<TVariables, TExecutionResult>(
    query: string,
    operationName: string,
    variables: TVariables
  ) {
    //
  }*/
}
