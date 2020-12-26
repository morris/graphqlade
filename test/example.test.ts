import got from "got";
import * as assert from "assert";
import { requireExampleServer } from "./util";
import { GraphQLReader } from "../src";

describe("The example", () => {
  let operations: string;

  requireExampleServer();

  before(async () => {
    const reader = new GraphQLReader();
    operations = await reader.readDir(
      `${__dirname}/../examples/client/operations`
    );
  });

  it("should run", async () => {
    const r = await got("http://localhost:4999/graphql", {
      method: "POST",
      json: {
        query: operations,
        operationName: "Bosses",
      },
      responseType: "json",
    });

    assert.deepStrictEqual(r.body, {
      data: {
        bosses: [
          {
            id: "1",
            location: {
              id: "11",
              name: "Northern Undead Asylum",
            },
            name: "Asylum Demon",
          },
          {
            id: "2",
            location: {
              id: "12",
              name: "Undead Burg",
            },
            name: "Taurus Demon",
          },
          {
            id: "3",
            location: {
              id: "13",
              name: "Undead Parish",
            },
            name: "Bell Gargoyles",
          },
        ],
      },
    });
  });
});
