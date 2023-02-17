import { IncomingHttpHeaders } from "http";
import { ParsedQs } from "./GraphQLHttpServer";

export interface KoaContextLike {
  request: {
    method: string;
    headers: IncomingHttpHeaders;
    query?: ParsedQs;
    body?: unknown;
  };
  status?: number;
  set: (headers: Record<string, string>) => unknown;
  body?: unknown;
}

export type KoaNextFunctionLike = () => Promise<unknown>;
