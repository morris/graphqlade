import { IncomingHttpHeaders } from 'http';
import { ParsedQs } from './GraphQLHttpServer';

export interface ExpressRequestLike {
  method: string;
  headers: IncomingHttpHeaders;
  query?: ParsedQs;
  body?: unknown;
}

export interface ExpressResponseLike {
  status: (statusCode: number) => ExpressResponseLike;
  set: (headers: Record<string, string>) => ExpressResponseLike;
  json: (data: unknown) => ExpressResponseLike;
}

export type ExpressNextFunctionLike = (err?: unknown) => unknown;
