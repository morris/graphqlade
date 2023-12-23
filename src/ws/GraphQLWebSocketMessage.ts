import type { ExecutionResult, GraphQLError } from 'graphql';

export type GraphQLWebSocketMessage =
  | ConnectionInitMessage
  | ConnectionAckMessage
  | SubscribeMessage
  | NextMessage
  | ErrorMessage
  | CompleteMessage;

export type GraphQLWebSocketServerMessage =
  | ConnectionAckMessage
  | NextMessage
  | ErrorMessage
  | CompleteMessage;

export type GraphQLWebSocketClientMessage =
  | ConnectionInitMessage
  | SubscribeMessage
  | ErrorMessage
  | CompleteMessage;

export interface ConnectionInitMessage {
  type: 'connection_init';
  payload?: Record<string, unknown> | null;
}

export interface ConnectionAckMessage {
  type: 'connection_ack';
  payload?: Record<string, unknown> | null;
}

export interface SubscribeMessage {
  type: 'subscribe';
  id: string;
  payload: {
    query: string;
    operationName?: string | null;
    variables?: Record<string, unknown> | null;
  };
}

export interface NextMessage {
  type: 'next';
  id: string;
  payload: ExecutionResult<unknown, unknown>;
}

export interface ErrorMessage {
  type: 'error';
  id: string;
  payload: readonly GraphQLError[];
}

export interface CompleteMessage {
  type: 'complete';
  id: string;
}
