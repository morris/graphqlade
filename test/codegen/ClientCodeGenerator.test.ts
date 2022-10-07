import { visit } from "graphql";
import { format } from "prettier";
import { ClientCodeGenerator, GraphQLReader } from "../../src";

describe("The ClientCodeGenerator", () => {
  const reader = new GraphQLReader();

  it("should uplift __typename from fragment spreads", async () => {
    const schema = await reader.buildSchemaFromDir("examples/server/schema");
    const operations = await reader.parseDir("examples/client/operations");
    const generator: ClientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    let found = false;

    visit(operations, {
      OperationDefinition: (node) => {
        generator.assertNamedOperationDefinition(node);

        if (node.name?.value === "Reviews2") {
          found = true;
          expect(
            format(generator.generateOperationDataType(node), {
              parser: "typescript",
            })
          ).toEqual(`export type DReviews2 = {
  reviews: Maybe<
    Array<
      | ({
          __typename: "BossReview";
        } & (FBaseReview2 & FBossReview2))
      | ({
          __typename: "LocationReview";
        } & FBaseReview2)
    >
  >;
};
`);
        }
      },
    });

    expect(found).toBeTruthy();
  });

  it("should uplift __typename from inline fragments", async () => {
    const schema = await reader.buildSchemaFromDir("examples/server/schema");
    const operations = await reader.parseDir("examples/client/operations");
    const generator: ClientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    let found = false;

    visit(operations, {
      OperationDefinition: (node) => {
        generator.assertNamedOperationDefinition(node);

        if (node.name?.value === "Reviews3") {
          found = true;
          expect(
            format(generator.generateOperationDataType(node), {
              parser: "typescript",
            })
          ).toEqual(`export type DReviews3 = {
  reviews: Maybe<
    Array<
      | ({
          __typename: "BossReview";
        } & ({} & {
          boss: {
            id: string;

            name: string;
          };
        }))
      | ({
          __typename: "LocationReview";
        } & {})
    >
  >;
};
`);
        }
      },
    });

    expect(found).toBeTruthy();
  });

  it("should not uplift __typename if it is not requested", async () => {
    const schema = await reader.buildSchemaFromDir("examples/server/schema");
    const operations = await reader.parseDir("examples/client/operations");
    const generator: ClientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    let found = false;

    visit(operations, {
      OperationDefinition: (node) => {
        generator.assertNamedOperationDefinition(node);

        if (node.name?.value === "Reviews4") {
          found = true;
          expect(
            format(generator.generateOperationDataType(node), {
              parser: "typescript",
            })
          ).toEqual(`export type DReviews4 = {
  reviews: Maybe<
    Array<
      | ({} & {
          boss: {
            id: string;

            name: string;
          };
        } & FBaseReview4)
      | ({} & FBaseReview4)
    >
  >;
};
`);
        }
      },
    });

    expect(found).toBeTruthy();
  });

  it("should only uplift __typename for possible types where it is requested", async () => {
    const schema = await reader.buildSchemaFromDir("examples/server/schema");
    const operations = await reader.parseDir("examples/client/operations");
    const generator: ClientCodeGenerator = new ClientCodeGenerator({
      schema,
      operations,
    });

    let found = false;

    visit(operations, {
      OperationDefinition: (node) => {
        generator.assertNamedOperationDefinition(node);

        if (node.name?.value === "Reviews5") {
          found = true;
          expect(
            format(generator.generateOperationDataType(node), {
              parser: "typescript",
            })
          ).toEqual(`export type DReviews5 = {
  reviews: Maybe<
    Array<
      | ({
          __typename: "BossReview";
        } & {
          boss: {
            id: string;

            name: string;
          };
        } & FBaseReview5)
      | ({} & FBaseReview5)
    >
  >;
};
`);
        }
      },
    });

    expect(found).toBeTruthy();
  });
});
