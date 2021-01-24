import {
  DocumentNode,
  OperationDefinitionNode,
  visit,
  FieldNode,
  GraphQLObjectType,
  SelectionSetNode,
  GraphQLInterfaceType,
  GraphQLCompositeType,
  isCompositeType,
  FragmentSpreadNode,
  InlineFragmentNode,
  isObjectType,
  VariableDefinitionNode,
  TypeNode,
  GraphQLNonNull,
  GraphQLList,
  GraphQLType,
  assertInputType,
  assertType,
  isInputObjectType,
  isEnumType,
  NameNode,
  print,
  FragmentDefinitionNode,
  GraphQLSchema,
  isNonNullType,
  isListType,
  GraphQLOutputType,
  GraphQLNamedType,
  assertCompositeType,
} from "graphql";
import { ImportCodeGenerator } from "./ImportCodeGenerator";
import { CommonCodeGenerator, TsDirective } from "./CommonCodeGenerator";
import { assertDefined } from "../util/assert";
import { getDirective } from "../util/directives";

export interface ClientCodeGeneratorOptions {
  schema: GraphQLSchema;
  operations: DocumentNode;
}

export type NamedOperationDefinitionNode = OperationDefinitionNode & {
  name: NameNode;
};

export type FragmentMapEntry = {
  node: FragmentDefinitionNode;
  dependencies: Set<string>;
};

export class ClientCodeGenerator {
  protected schema: GraphQLSchema;
  protected operations: DocumentNode;
  protected commonCodeGenerator: CommonCodeGenerator;
  protected fragmentMap = new Map<string, FragmentMapEntry>();

  constructor(options: ClientCodeGeneratorOptions) {
    this.schema = options.schema;
    this.operations = options.operations;
    this.commonCodeGenerator = new CommonCodeGenerator(options);

    this.initScalarMappings();
    this.initFragmentMap();
  }

  //

  initScalarMappings() {
    visit(this.operations, {
      ScalarTypeDefinition: (node) => {
        const tsDirective = getDirective<TsDirective>(node, "ts");

        if (tsDirective) {
          this.commonCodeGenerator.addTypeMapping({
            gqlType: node.name.value,
            tsType: tsDirective.type,
            tsInputType: tsDirective.inputType,
            from: tsDirective.from,
          });
        } else {
          this.commonCodeGenerator.addTypeMapping({
            gqlType: node.name.value,
            tsType: "string",
          });
        }
      },
    });
  }

  initFragmentMap() {
    visit(this.operations, {
      FragmentDefinition: (node) => {
        const dependencies = new Set<string>();

        visit(node, {
          FragmentSpread: (node) => {
            dependencies.add(node.name.value);
          },
        });

        this.fragmentMap.set(node.name.value, { node, dependencies });
      },
    });
  }

  //

  generateClient() {
    return this.join([
      this.generateHeader(),
      this.generateImports(),
      this.generateHelpers(),
      this.generateAbstractClient(),
      this.generateOperationTypes(),
      this.generateFragmentTypes(),
      this.generateInputTypes(),
      this.generateOperationNameToDocument(),
      this.generateOperationNameToVariables(),
      this.generateOperationNameToData(),
      this.generateOperationNames(),
      this.generateQueryNames(),
      this.generateMutationNames(),
      this.generateSubscriptionNames(),
    ]);
  }

  generateHeader() {
    return this.commonCodeGenerator.generateHeader();
  }

  generateImports() {
    const importCodeGenerator = new ImportCodeGenerator();

    importCodeGenerator.addImport({
      names: ["ExecutionResult"],
      from: "graphql",
    });

    this.commonCodeGenerator.addTypeMapImports(importCodeGenerator);

    return importCodeGenerator.generateImports();
  }

  generateHelpers() {
    return this.join([
      this.commonCodeGenerator.generateHelpers(),
      `export function typeRef<T>(value: T | null | undefined = null): T {
        return value as T;
      }`,
    ]);
  }

  // abstract client

  generateAbstractClient() {
    return `export abstract class AbstractClient<
      TExtensions = Record<string, unknown>,
      TOperationExtra = unknown,
      TExecutionResultExtra = unknown
    > {
      async query<TVariables, TExecutionResult>(
        document: string,
        operationName: string,
        variables: TVariables,
        extra?: TOperationExtra
      ): Promise<TExecutionResult & TExecutionResultExtra> {
        throw new Error("AbstractClient.query not implemented");
      }

      async mutate<TVariables, TExecutionResult>(
        document: string,
        operationName: string,
        variables: TVariables,
        extra?: TOperationExtra
      ): Promise<TExecutionResult & TExecutionResultExtra> {
        return this.query(document, operationName, variables, extra);
      }

      subscribe<TVariables, TExecutionResult>(
        document: string,
        operationName: string,
        variables: TVariables,
        extra?: TOperationExtra
      ): AsyncIterableIterator<TExecutionResult & TExecutionResultExtra> {
        throw new Error("AbstractClient.subscribe not implemented");
      }

      ${this.generateOperations()}
    }`;
  }

  generateOperations() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        parts.push(this.generateOperation(node));
      },
    });

    return this.join(parts);
  }

  generateOperation(node: NamedOperationDefinitionNode) {
    switch (node.operation) {
      case "query":
        return this.generateQuery(node);
      case "mutation":
        return this.generateMutation(node);
      case "subscription":
        return this.generateSubscription(node);
    }
  }

  generateQuery(node: NamedOperationDefinitionNode) {
    const name = node.name.value;
    const safeName = JSON.stringify(name);
    const variablesArg = this.generateVariablesArg(node);

    return `async query${name}(${variablesArg}, extra?: TOperationExtra):
        Promise<X${name}<TExtensions> & TExecutionResultExtra> {
      return this.query(${name}Document, ${safeName}, variables, extra);
    }`;
  }

  generateMutation(node: NamedOperationDefinitionNode) {
    const name = node.name.value;
    const safeName = JSON.stringify(name);
    const variablesArg = this.generateVariablesArg(node);

    return `async mutate${name}(${variablesArg}, extra?: TOperationExtra):
        Promise<X${name}<TExtensions> & TExecutionResultExtra> {
      return this.mutate(${name}Document, ${safeName}, variables, extra);
    }`;
  }

  generateSubscription(node: NamedOperationDefinitionNode) {
    const name = node.name.value;
    const safeName = JSON.stringify(name);
    const variablesArg = this.generateVariablesArg(node);

    return `subscribe${name}(${variablesArg}, extra?: TOperationExtra):
        AsyncIterableIterator<X${name}<TExtensions> & TExecutionResultExtra> {
      return this.subscribe(${name}Document, ${safeName}, variables, extra);
    }`;
  }

  generateVariablesArg(node: NamedOperationDefinitionNode) {
    const variablesRef = this.generateVariablesRef(node);

    return variablesRef === "undefined"
      ? `variables?: undefined`
      : `variables: ${variablesRef}`;
  }

  generateVariablesRef(node: NamedOperationDefinitionNode) {
    if (!node.variableDefinitions || node.variableDefinitions.length === 0) {
      return "undefined";
    }

    return `V${node.name.value}`;
  }

  // operation tables

  generateOperationNames() {
    return `export type OperationName =
      QueryName | MutationName | SubscriptionName`;
  }

  generateQueryNames() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        if (node.operation === "query") {
          parts.push(JSON.stringify(node.name.value));
        }
      },
    });

    return `export type QueryName = ${this.join(parts, " | ")}`;
  }

  generateMutationNames() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        if (node.operation === "mutation") {
          parts.push(JSON.stringify(node.name.value));
        }
      },
    });

    return `export type MutationName = ${this.join(parts, " | ")}`;
  }

  generateSubscriptionNames() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        if (node.operation === "subscription") {
          parts.push(JSON.stringify(node.name.value));
        }
      },
    });

    return `export type SubscriptionName = ${this.join(parts, " | ")}`;
  }

  generateOperationNameToDocument() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        parts.push(`${node.name.value}: ${node.name.value}Document,`);
      },
    });

    return `export const OperationNameToDocument = {
      ${this.join(parts, "\n")}
    }`;
  }

  generateOperationNameToVariables() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        parts.push(`${node.name.value}: ${this.generateVariablesRef(node)};`);
      },
    });

    return `export interface OperationNameToVariables {
      ${this.join(parts, "\n")}
    }`;
  }

  generateOperationNameToData() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        parts.push(`${node.name.value}: D${node.name.value};`);
      },
    });

    return `export interface OperationNameToData {
      ${this.join(parts, "\n")}
    }`;
  }

  // operation types

  generateOperationTypes() {
    const parts: (string | undefined)[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        parts.push(this.generateOperationDocument(node));
        parts.push(this.generateVariablesType(node));
        parts.push(this.generateExecutionResult(node));
        parts.push(this.generateOperationDataType(node));
      },
    });

    return this.join(parts);
  }

  generateOperationDocument(node: NamedOperationDefinitionNode) {
    return `export const ${node.name.value}Document =
      ${JSON.stringify(
        this.join([print(node), this.generateOperationFragments(node)])
      )}`;
  }

  generateOperationFragments(node: NamedOperationDefinitionNode) {
    const names = new Set<string>();
    const collect = (name: string) => {
      const entry = this.requireFragment(name);
      names.add(name);

      for (const dependency of entry.dependencies) {
        if (!names.has(dependency)) collect(dependency);
      }
    };

    visit(node, {
      FragmentSpread: (node) => {
        collect(node.name.value);
      },
    });

    return this.join(
      Array.from(names).map((name) => print(this.requireFragment(name).node))
    );
  }

  // variable types

  generateVariablesType(node: NamedOperationDefinitionNode) {
    if (node.variableDefinitions && node.variableDefinitions.length > 0) {
      return `export interface V${node.name.value} {
        ${node.variableDefinitions.map((it) => this.generateVariableDef(it))}
      }`;
    }
  }

  generateVariableDef(node: VariableDefinitionNode) {
    return `${node.variable.name.value}${
      node.type.kind === "NonNullType" ? "" : "?"
    }: ${this.commonCodeGenerator.generateInputRef(
      this.requireInputTypeFromNode(node.type),
      false
    )}`;
  }

  // execution result types

  generateExecutionResult(node: NamedOperationDefinitionNode) {
    return `export type X${node.name.value}<TExtensions> =
      ExecutionResult<D${node.name.value}, TExtensions>;`;
  }

  // operation data types

  generateOperationDataType(node: NamedOperationDefinitionNode) {
    return `export type D${node.name.value} =
      ${this.generateSelectionSet(
        node.selectionSet,
        this.requireOperationType(node)
      )}
    `;
  }

  // selection sets

  generateSelectionSet(
    node: SelectionSetNode,
    parentType: GraphQLCompositeType
  ) {
    const possibleTypes = isObjectType(parentType)
      ? [parentType]
      : this.schema.getPossibleTypes(parentType);

    return this.join(
      possibleTypes.map((possibleType) =>
        this.generateSelectionSetForObject(node, possibleType)
      ),
      " | "
    );
  }

  generateSelectionSetForObject(
    node: SelectionSetNode,
    parentType: GraphQLObjectType
  ): string {
    return this.join(
      [
        this.generateFields(node, parentType),
        this.generateInlineFragments(node, parentType),
        this.generateFragmentSpreads(node, parentType),
      ],
      " & ",
      "()"
    );
  }

  // fields

  generateFields(node: SelectionSetNode, parentType: GraphQLObjectType) {
    return `{
      ${this.join(
        node.selections.map((it) =>
          it.kind === "Field" ? this.generateField(it, parentType) : undefined
        )
      )}
    }`;
  }

  generateField(node: FieldNode, parentType: GraphQLObjectType) {
    if (node.name.value === "__typename") {
      return `__typename: "${parentType.name}"`;
    }

    const key = node.alias ? node.alias.value : node.name.value;
    const field = this.requireField(parentType, node.name.value);

    return `${key}: ${this.generateFieldType(node, field.type)}`;
  }

  generateFieldType(
    node: FieldNode,
    type: GraphQLOutputType,
    optional = true
  ): string {
    if (isNonNullType(type)) {
      return this.generateFieldType(node, type.ofType, false);
    } else if (isListType(type)) {
      return this.generateMaybe(
        `Array<${this.generateFieldType(node, type.ofType)}>`,
        optional
      );
    } else {
      return this.generateMaybe(
        this.generateFieldNamedType(node, type),
        optional
      );
    }
  }

  generateFieldNamedType(node: FieldNode, type: GraphQLNamedType) {
    if (isCompositeType(type)) {
      return this.generateFieldCompositeType(node, type);
    } else {
      return this.commonCodeGenerator.generateNamedOutputRef(type);
    }
  }

  generateFieldCompositeType(node: FieldNode, type: GraphQLCompositeType) {
    assertDefined(node.selectionSet);

    return this.generateSelectionSet(node.selectionSet, type);
  }

  // inline fragments

  generateInlineFragments(
    node: SelectionSetNode,
    parentType: GraphQLObjectType
  ) {
    return this.join(
      node.selections.map((it) =>
        it.kind === "InlineFragment"
          ? this.generateInlineFragment(it, parentType)
          : undefined
      ),
      " & ",
      "()"
    );
  }

  generateInlineFragment(
    node: InlineFragmentNode,
    parentType: GraphQLObjectType
  ) {
    if (this.checkTypeCondition(node, parentType)) {
      return this.generateSelectionSetForObject(node.selectionSet, parentType);
    }
  }

  // fragment spreads

  generateFragmentSpreads(
    node: SelectionSetNode,
    parentType: GraphQLObjectType
  ) {
    return this.join(
      node.selections.map((it) =>
        it.kind === "FragmentSpread"
          ? this.generateFragmentSpread(it, parentType)
          : undefined
      ),
      " & ",
      "()"
    );
  }

  generateFragmentSpread(
    node: FragmentSpreadNode,
    parentType: GraphQLObjectType
  ) {
    const fragment = this.requireFragment(node.name.value);

    if (this.checkTypeCondition(fragment.node, parentType)) {
      return this.generateFragmentTypeName(fragment.node.name.value);
    }
  }

  // fragment types

  generateFragmentTypes() {
    const parts: string[] = [];

    visit(this.operations, {
      FragmentDefinition: (node) => {
        parts.push(this.generateFragmentType(node));
      },
    });

    return this.join(parts);
  }

  generateFragmentType(node: FragmentDefinitionNode) {
    const type = assertCompositeType(
      this.requireTypeFromNode(node.typeCondition)
    );

    return `export type ${this.generateFragmentTypeName(node.name.value)} =
      ${this.generateSelectionSet(node.selectionSet, type)}
    `;
  }

  generateFragmentTypeName(name: string) {
    return `F${this.firstToUpper(name)}`;
  }

  // input types

  generateInputTypes() {
    const types = Object.values(this.schema.getTypeMap());

    // TODO only include input types we actually need?

    return this.join(types.map((it) => this.generateInputType(it)));
  }

  generateInputType(type: GraphQLNamedType) {
    if (isInputObjectType(type)) {
      return this.commonCodeGenerator.generateInputObject(type);
    } else if (isEnumType(type)) {
      return this.commonCodeGenerator.generateEnum(type);
    }
  }

  // helpers

  generateMaybe(any: string, optional: boolean) {
    return this.commonCodeGenerator.generateMaybe(any, optional);
  }

  // util

  checkTypeCondition(
    node: InlineFragmentNode | FragmentDefinitionNode,
    parentType: GraphQLObjectType
  ) {
    assertDefined(
      node.typeCondition,
      "Missing type condition in fragment spread" // should never happen
    );

    const name = node.typeCondition.name.value;

    return (
      parentType.name === name ||
      !!parentType.getInterfaces().find((it) => it.name === name)
    );
  }

  requireOperationType(node: OperationDefinitionNode) {
    const type = this.getOperationType(node);

    assertDefined(type, `Schema does not define a ${node.operation} type`);

    return type;
  }

  getOperationType(node: OperationDefinitionNode) {
    switch (node.operation) {
      case "query":
        return this.schema.getQueryType();
      case "mutation":
        return this.schema.getMutationType();
      case "subscription":
        return this.schema.getSubscriptionType();
    }
  }

  requireInputTypeFromNode(node: TypeNode) {
    return assertInputType(this.requireTypeFromNode(node));
  }

  requireTypeFromNode(node: TypeNode): GraphQLType {
    switch (node.kind) {
      case "NonNullType":
        return new GraphQLNonNull(this.requireTypeFromNode(node.type));
      case "ListType":
        return new GraphQLList(this.requireTypeFromNode(node.type));
      case "NamedType":
        return this.requireType(node.name.value);
    }
  }

  requireType(name: string) {
    return assertType(this.schema.getType(name));
  }

  requireField(type: GraphQLObjectType | GraphQLInterfaceType, name: string) {
    const field = type.getFields()[name];

    assertDefined(field, `Undefined field ${name} on ${type.name}`);

    return field;
  }

  requireFragment(name: string) {
    const entry = this.fragmentMap.get(name);

    assertDefined(entry, `${name} not in fragment map`);

    return entry;
  }

  assertNamedOperationDefinition(
    node: OperationDefinitionNode
  ): asserts node is NamedOperationDefinitionNode {
    assertDefined(
      node.name,
      "Cannot generate client code for unnamed operations"
    );
  }

  join(parts: (string | undefined)[], separator = "\n\n", braces?: string) {
    return this.commonCodeGenerator.join(parts, separator, braces);
  }

  firstToUpper(name: string) {
    return this.commonCodeGenerator.firstToUpper(name);
  }
}
