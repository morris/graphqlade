import {
  assertCompositeType,
  assertInputType,
  assertType,
  DocumentNode,
  FieldNode,
  FragmentDefinitionNode,
  FragmentSpreadNode,
  GraphQLCompositeType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
  GraphQLType,
  InlineFragmentNode,
  isCompositeType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  isObjectType,
  Kind,
  NameNode,
  OperationDefinitionNode,
  print,
  SelectionSetNode,
  stripIgnoredCharacters,
  TypeNode,
  VariableDefinitionNode,
  visit,
} from 'graphql';
import { assert, defined, getDirective } from '../util';
import { CommonCodeGenerator, TsDirective } from './CommonCodeGenerator';
import { ImportCodeGenerator } from './ImportCodeGenerator';

export interface ClientCodeGeneratorOptions {
  schema: GraphQLSchema;
  operations: DocumentNode;
  scalarTypes?: Record<string, string | { type: string; from?: string }>;
  commonCodeGenerator?: CommonCodeGenerator;
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
  protected scalarTypes: Record<
    string,
    string | { type: string; from?: string }
  >;
  protected commonCodeGenerator: CommonCodeGenerator;
  protected fragmentMap = new Map<string, FragmentMapEntry>();

  constructor(options: ClientCodeGeneratorOptions) {
    this.schema = options.schema;
    this.operations = options.operations;
    this.scalarTypes = options.scalarTypes ?? {};
    this.commonCodeGenerator =
      options.commonCodeGenerator ?? new CommonCodeGenerator(options);

    this.mapScalars();
    this.initFragmentMap();
  }

  //

  mapScalars() {
    // TODO remove this in 2.0 in favor of options.scalarTypes
    visit(this.operations, {
      ScalarTypeDefinition: (node) => {
        const tsDirective = getDirective<TsDirective>(node, 'ts');

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
            tsType: 'string',
          });
        }
      },
    });

    for (const [gqlType, tsType] of Object.entries(this.scalarTypes)) {
      this.commonCodeGenerator.addTypeMapping({
        gqlType,
        tsType: typeof tsType === 'string' ? tsType : tsType.type,
        from: typeof tsType === 'string' ? undefined : tsType.from,
      });
    }
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
      this.generateOperationTypings(),
    ]);
  }

  generateHeader() {
    return this.commonCodeGenerator.generateHeader();
  }

  generateImports() {
    const importCodeGenerator = new ImportCodeGenerator();

    importCodeGenerator.addImport({
      names: ['ExecutionResult'],
      from: 'graphql',
    });

    this.commonCodeGenerator.addTypeMapImports(importCodeGenerator);

    return importCodeGenerator.generateImports();
  }

  generateHelpers() {
    return this.join([
      this.commonCodeGenerator.generateHelpers(),
      `export function typeRef<T>(value?: T | null): T {
        return {} as T;
      }`,
    ]);
  }

  // operation tables

  generateOperationTypings() {
    return `export interface OperationTypings {
      OperationName: OperationName;
      QueryName: QueryName;
      MutationName: MutationName;
      SubscriptionName: SubscriptionName;
      OperationNameToVariables: OperationNameToVariables;
      OperationNameToData: OperationNameToData;
      OperationNameToDocument: Record<OperationName, string>;
    }

    export const typings = { OperationNameToDocument } as unknown as OperationTypings`;
  }

  generateOperationNames() {
    return `export type OperationName =
      QueryName | MutationName | SubscriptionName`;
  }

  generateQueryNames() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        if (node.operation === 'query') {
          parts.push(JSON.stringify(node.name.value));
        }
      },
    });

    if (parts.length === 0) parts.push('never');

    return `export type QueryName = ${this.join(parts, ' | ')}`;
  }

  generateMutationNames() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        if (node.operation === 'mutation') {
          parts.push(JSON.stringify(node.name.value));
        }
      },
    });

    if (parts.length === 0) parts.push('never');

    return `export type MutationName = ${this.join(parts, ' | ')}`;
  }

  generateSubscriptionNames() {
    const parts: string[] = [];

    visit(this.operations, {
      OperationDefinition: (node) => {
        this.assertNamedOperationDefinition(node);

        if (node.operation === 'subscription') {
          parts.push(JSON.stringify(node.name.value));
        }
      },
    });

    if (parts.length === 0) parts.push('never');

    return `export type SubscriptionName = ${this.join(parts, ' | ')}`;
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
      ${this.join(parts, '\n')}
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
      ${this.join(parts, '\n')}
    }`;
  }

  generateVariablesRef(node: NamedOperationDefinitionNode) {
    if (!node.variableDefinitions || node.variableDefinitions.length === 0) {
      return 'undefined';
    }

    return `V${node.name.value}`;
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
      ${this.join(parts, '\n')}
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
        this.join([
          stripIgnoredCharacters(print(node)),
          this.generateOperationFragments(node),
        ]),
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
      Array.from(names).map((name) =>
        stripIgnoredCharacters(print(this.requireFragment(name).node)),
      ),
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
      node.type.kind === 'NonNullType' ? '' : '?'
    }: ${this.commonCodeGenerator.generateInputRef(
      this.requireInputTypeFromNode(node.type),
      false,
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
        this.requireOperationType(node),
      )}
    `;
  }

  // selection sets

  generateSelectionSet(
    node: SelectionSetNode,
    parentType: GraphQLCompositeType,
  ) {
    const possibleTypes = isObjectType(parentType)
      ? [parentType]
      : this.schema.getPossibleTypes(parentType);

    return this.join(
      possibleTypes.map((possibleType) =>
        this.generateSelectionSetForObject(node, possibleType),
      ),
      ' | ',
    );
  }

  generateSelectionSetForObject(
    node: SelectionSetNode,
    parentType: GraphQLObjectType,
    withTypeNameField = true,
  ): string {
    return this.join(
      [
        this.generateFields(
          node,
          parentType,
          withTypeNameField && this.hasTypeNameField(node, parentType),
        ),
        this.generateInlineFragments(node, parentType),
        this.generateFragmentSpreads(node, parentType),
      ],
      ' & ',
      '()',
    );
  }

  hasTypeNameField(node: SelectionSetNode, parentType: GraphQLObjectType) {
    for (const selection of node.selections) {
      if (selection.kind === 'Field' && selection.name.value === '__typename') {
        return true;
      } else if (
        selection.kind === 'InlineFragment' &&
        this.checkTypeCondition(selection, parentType) &&
        this.hasTypeNameField(selection.selectionSet, parentType)
      ) {
        return true;
      } else if (selection.kind === 'FragmentSpread') {
        const fragment = this.requireFragment(selection.name.value);

        if (
          this.checkTypeCondition(fragment.node, parentType) &&
          this.hasTypeNameField(fragment.node.selectionSet, parentType)
        ) {
          return true;
        }
      }
    }

    return false;
  }

  // fields

  generateFields(
    node: SelectionSetNode,
    parentType: GraphQLObjectType,
    withTypeNameField: boolean,
  ) {
    return `{
      ${this.join(
        node.selections
          .filter((it): it is FieldNode => it.kind === 'Field')
          .filter((it) => it.name.value !== '__typename')
          .map((it) => this.generateField(it, parentType))
          .concat(
            withTypeNameField ? [`__typename: "${parentType.name}"`] : [],
          ),
      )}
    }`;
  }

  generateField(node: FieldNode, parentType: GraphQLObjectType) {
    const key = node.alias ? node.alias.value : node.name.value;
    const field = this.requireField(parentType, node.name.value);
    const nonNull = isNonNullType(field.type);

    return `${key}${nonNull ? '' : '?'}: ${this.generateFieldType(
      node,
      field.type,
    )}`;
  }

  generateFieldType(
    node: FieldNode,
    type: GraphQLOutputType,
    optional = true,
  ): string {
    if (isNonNullType(type)) {
      return this.generateFieldType(node, type.ofType, false);
    } else if (isListType(type)) {
      return this.generateMaybe(
        `Array<${this.generateFieldType(node, type.ofType)}>`,
        optional,
      );
    } else {
      return this.generateMaybe(
        this.generateFieldNamedType(node, type),
        optional,
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
    return this.generateSelectionSet(defined(node.selectionSet), type);
  }

  // inline fragments

  generateInlineFragments(
    node: SelectionSetNode,
    parentType: GraphQLObjectType,
  ) {
    return this.join(
      node.selections.map((it) =>
        it.kind === 'InlineFragment'
          ? this.generateInlineFragment(it, parentType)
          : undefined,
      ),
      ' & ',
      '()',
    );
  }

  generateInlineFragment(
    node: InlineFragmentNode,
    parentType: GraphQLObjectType,
  ) {
    if (this.checkTypeCondition(node, parentType)) {
      return this.generateSelectionSetForObject(
        node.selectionSet,
        parentType,
        false,
      );
    }
  }

  // fragment spreads

  generateFragmentSpreads(
    node: SelectionSetNode,
    parentType: GraphQLObjectType,
  ) {
    return this.join(
      node.selections.map((it) =>
        it.kind === 'FragmentSpread'
          ? this.generateFragmentSpread(it, parentType)
          : undefined,
      ),
      ' & ',
      '()',
    );
  }

  generateFragmentSpread(
    node: FragmentSpreadNode,
    parentType: GraphQLObjectType,
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
      this.requireTypeFromNode(node.typeCondition),
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
    parentType: GraphQLObjectType,
  ) {
    const name = defined(
      node.typeCondition,
      'Missing type condition in fragment spread', // should never happen
    ).name.value;

    return (
      parentType.name === name ||
      !!parentType.getInterfaces().find((it) => it.name === name)
    );
  }

  requireOperationType(node: OperationDefinitionNode) {
    const type = this.getOperationType(node);

    return defined(type, `Schema does not define a ${node.operation} type`);
  }

  getOperationType(node: OperationDefinitionNode) {
    switch (node.operation) {
      case 'query':
        return this.schema.getQueryType();
      case 'mutation':
        return this.schema.getMutationType();
      case 'subscription':
        return this.schema.getSubscriptionType();
    }
  }

  requireInputTypeFromNode(node: TypeNode) {
    return assertInputType(this.requireTypeFromNode(node));
  }

  requireTypeFromNode(node: TypeNode): GraphQLType {
    switch (node.kind) {
      case Kind.NON_NULL_TYPE:
        return new GraphQLNonNull(this.requireTypeFromNode(node.type));
      case Kind.LIST_TYPE:
        return new GraphQLList(this.requireTypeFromNode(node.type));
      case Kind.NAMED_TYPE:
        return this.requireType(node.name.value);
    }
  }

  requireType(name: string) {
    return assertType(this.schema.getType(name));
  }

  requireField(type: GraphQLObjectType | GraphQLInterfaceType, name: string) {
    return defined(
      type.getFields()[name],
      `Undefined field ${name} on ${type.name}`,
    );
  }

  requireFragment(name: string) {
    return defined(this.fragmentMap.get(name), `${name} not in fragment map`);
  }

  assertNamedOperationDefinition(
    node: OperationDefinitionNode,
  ): asserts node is NamedOperationDefinitionNode {
    assert(node.name, 'Cannot generate client code for unnamed operations');
  }

  join(parts: (string | undefined)[], separator = '\n\n', braces?: string) {
    return this.commonCodeGenerator.join(parts, separator, braces);
  }

  firstToUpper(name: string) {
    return this.commonCodeGenerator.firstToUpper(name);
  }
}
