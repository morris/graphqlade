import {
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import type { ExecutionResult } from 'graphql';
import {
  GraphQLClient,
  GraphQLRequestInit,
  GraphQLWebSocketClient,
} from 'graphqlade/dist/browser';
import { useEffect, useState } from 'react';
import {
  MutationName,
  OperationNameToData,
  OperationNameToVariables,
  QueryName,
  SubscriptionName,
  typings,
} from './generated/operations';

export const url = 'http://localhost:4000/graphql';

export const gqlClient = new GraphQLClient({
  url,
  typings,
});

// React Query Shortcuts

export function useGqlQuery<TQueryName extends QueryName>(
  name: TQueryName,
  variables: OperationNameToVariables[TQueryName],
  options?: GraphQLRequestInit &
    UseQueryOptions<ExecutionResult<OperationNameToData[TQueryName]>, Error>,
) {
  const result = useQuery<
    ExecutionResult<OperationNameToData[TQueryName]>,
    Error
  >(
    [name, variables],
    async () => gqlClient.postNamed(name, variables, options),
    options,
  );

  return {
    ...result,
    data: result.data?.data,
    errors: result.data?.errors,
    extensions: result.data?.extensions,
  };
}

export function useGqlMutation<TMutationName extends MutationName>(
  name: TMutationName,
  options?: GraphQLRequestInit &
    UseMutationOptions<
      ExecutionResult<OperationNameToData[TMutationName]>,
      Error,
      OperationNameToVariables[TMutationName]
    >,
) {
  const result = useMutation<
    ExecutionResult<OperationNameToData[TMutationName]>,
    Error,
    OperationNameToVariables[TMutationName]
  >(
    [name],
    (variables) => gqlClient.postNamed(name, variables, options),
    options,
  );

  return {
    ...result,
    data: result.data?.data,
    errors: result.data?.errors,
    extensions: result.data?.extensions,
  };
}

// Subscriptions

export const gqlWsClient = new GraphQLWebSocketClient({
  url,
  typings,
  connectionInitPayload: { keys: ['MASTER_KEY'] },
});

export function useGqlSubscription<TSubscriptionName extends SubscriptionName>(
  name: TSubscriptionName,
  variables: OperationNameToVariables[TSubscriptionName],
  options: {
    onData: (data: OperationNameToData[TSubscriptionName]) => unknown;
    onError: (error: Error) => unknown;
    enabled?: boolean;
  },
) {
  const [stop, setStop] = useState<() => void>();
  const enabled = options.enabled;

  useEffect(() => {
    stop?.();

    if (enabled === false) return;

    const nextStop = gqlWsClient.subscribeAsyncNamed<TSubscriptionName>(
      name,
      variables,
      options,
    );

    setStop(() => nextStop);

    return nextStop;
  }, [name, JSON.stringify(variables), enabled]);
}
