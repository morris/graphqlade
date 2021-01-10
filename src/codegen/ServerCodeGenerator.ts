import {
  GraphQLField,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  isObjectType,
  isInterfaceType,
  isScalarType,
  isUnionType,
  isInputObjectType,
  isEnumType,
  isNonNullType,
  GraphQLSchema,
  GraphQLEnumType,
  GraphQLEnumValue,
  GraphQLNamedType,
  isCompositeType,
} from "graphql";
import { CommonCodeGenerator, TsDirective } from "./CommonCodeGenerator";
import { ImportCodeGenerator } from "./ImportCodeGenerator";
import { getDirective } from "../util/directives";

export interface ServerCodeGeneratorOptions {
  schema: GraphQLSchema;
}

export class ServerCodeGenerator {
  protected schema: GraphQLSchema;
  protected commonCodeGenerator: CommonCodeGenerator;

  constructor(options: ServerCodeGeneratorOptions) {
    this.schema = options.schema;
    this.commonCodeGenerator = new CommonCodeGenerator(options);

    this.initTypeMappings();
  }

  //

  initTypeMappings() {
    const types = Object.values(this.schema.getTypeMap());

    for (const node of types) {
      if (isObjectType(node) || isInterfaceType(node)) {
        if (!node.astNode) continue;

        const tsDirective = getDirective<TsDirective>(node.astNode, "ts");

        if (tsDirective) {
          this.commonCodeGenerator.addTypeMapping({
            gqlType: node.name,
            tsType: tsDirective.type,
            from: tsDirective.from,
          });
        }
      } else if (isEnumType(node)) {
        if (!node.astNode) continue;

        const tsDirective = getDirective<TsDirective>(node.astNode, "ts");

        if (tsDirective) {
          this.commonCodeGenerator.addTypeMapping({
            gqlType: node.name,
            tsType: tsDirective.type,
            tsInputType: tsDirective.inputType,
            from: tsDirective.from,
          });
        }
      } else if (isScalarType(node)) {
        if (!node.astNode) continue;

        const tsDirective = getDirective<TsDirective>(node.astNode, "ts");

        if (tsDirective) {
          this.commonCodeGenerator.addTypeMapping({
            gqlType: node.name,
            tsType: tsDirective.type,
            tsInputType: tsDirective.inputType,
            from: tsDirective.from,
          });
        } else {
          this.commonCodeGenerator.addTypeMapping({
            gqlType: node.name,
            tsType: "string",
          });
        }
      }
    }
  }

  //

  generateServer() {
    return this.join([
      this.generateHeader(),
      this.generateImports(),
      this.generateHelpers(),
      this.generateResolverMap(),
      this.generateResolvers(),
      this.generateEnumResolvers(),
      this.generateSubscriptionResolver(),
      this.generateTypes(),
      this.generateArgsForTypes(),
      this.generateInputTypes(),
      this.generateDirectives(),
    ]);
  }

  generateHeader() {
    return this.commonCodeGenerator.generateHeader();
  }

  generateHelpers() {
    return `export type AsyncResult<T> = T | Promise<T>;
      ${this.commonCodeGenerator.generateHelpers()}`;
  }

  generateImports() {
    const importCodeGenerator = new ImportCodeGenerator();

    importCodeGenerator.addImport({
      names: ["GraphQLResolveInfo", "GraphQLEnumType", "GraphQLScalarType"],
      from: "graphql",
    });

    this.commonCodeGenerator.addTypeMapImports(importCodeGenerator);

    return importCodeGenerator.generateImports();
  }

  generateResolverMap() {
    const types = Object.values(this.schema.getTypeMap());

    return `export interface ResolverMap<TContext> {
      __isGeneratedResolverMap?: TContext,

      ${this.join(types.map((it) => this.generateResolverMapEntry(it)))}
    }`;
  }

  generateResolverMapEntry(node: GraphQLNamedType) {
    return `${node.name}?: ${this.generateResolverMapEntryType(node)};`;
  }

  generateResolverMapEntryType(node: GraphQLNamedType) {
    if (isCompositeType(node)) {
      return `R${node.name}<TContext>`;
    } else if (isEnumType(node)) {
      return `E${node.name} | GraphQLEnumType`;
    } else if (isScalarType(node)) {
      return `GraphQLScalarType`;
    }
  }

  generateResolvers() {
    const types = Object.values(this.schema.getTypeMap());

    return this.join(types.map((it) => this.generateResolver(it)));
  }

  generateResolver(node: GraphQLNamedType) {
    if (isObjectType(node)) {
      return this.generateObjectResolver(node);
    } else if (isInterfaceType(node)) {
      return this.generateInterfaceResolver(node);
    } else if (isUnionType(node)) {
      return this.generateUnionResolver(node);
    }
  }

  generateTypes() {
    const types = Object.values(this.schema.getTypeMap());

    return this.join(types.map((it) => this.generateType(it)));
  }

  generateArgsForTypes() {
    const types = Object.values(this.schema.getTypeMap());

    return this.join(types.map((it) => this.generateArgsForType(it)));
  }

  generateArgsForType(node: GraphQLNamedType) {
    if (isObjectType(node) || isInterfaceType(node)) {
      const fields = Object.values(node.getFields());

      return this.join(fields.map((it) => this.generateArgs(it, node)));
    }
  }

  generateInputTypes() {
    const types = Object.values(this.schema.getTypeMap());

    return this.join(types.map((it) => this.generateInputType(it)));
  }

  generateInputType(node: GraphQLNamedType) {
    if (isInputObjectType(node)) {
      return this.commonCodeGenerator.generateInputObject(node);
    } else if (isEnumType(node)) {
      return this.commonCodeGenerator.generateEnum(node);
    }
  }

  // type definitions

  generateType(node: GraphQLNamedType) {
    if (isObjectType(node) || isInterfaceType(node)) {
      const fields = Object.values(node.getFields());

      return `${this.commonCodeGenerator.generateDescription(node)}
        export interface T${node.name} {
          ${this.join(fields.map((it) => this.generateField(it)))}
        }`;
    } else if (isUnionType(node)) {
      return this.generateUnion(node);
    }
  }

  generateField(field: GraphQLField<unknown, unknown>) {
    return `${this.commonCodeGenerator.generateFieldDescription(field)}
      ${field.name}${isNonNullType(field.type) ? "" : "?"}:
        ${this.commonCodeGenerator.generateOutputRef(field.type, false)};`;
  }

  generateUnion(node: GraphQLUnionType) {
    return `${this.commonCodeGenerator.generateDescription(node)}
      export type T${node.name} = ${this.join(
      node
        .getTypes()
        .map((it) => this.commonCodeGenerator.generateNamedOutputRef(it)),
      " | "
    )}`;
  }

  // subscription resolver interface

  generateSubscriptionResolver() {
    const node = this.schema.getSubscriptionType();

    if (node) {
      const fields = Object.values(node.getFields());

      return `${this.commonCodeGenerator.generateDescription(node)}
        export interface S${node.name}<TContext> {
          __isGeneratedSubscriptionResolver?: TContext,

          ${this.join(
            fields.map((it) => this.generateSubscriptionField(it, node))
          )}
        }`;
    }
  }

  generateSubscriptionField(
    field: GraphQLField<unknown, unknown>,
    parent: GraphQLObjectType
  ) {
    const tResult = this.commonCodeGenerator.generateOutputRef(field.type);

    return `${this.commonCodeGenerator.generateFieldDescription(field)}
      ${field.name}?: (
        source: ${this.commonCodeGenerator.generateNamedOutputRef(parent)},
        args: ${this.generateArgsRef(field, parent)},
        context: TContext,
        info: GraphQLResolveInfo
      ) => AsyncResult<AsyncIterableIterator<{ ${field.name}: ${tResult} }>>`;
  }

  // resolver interfaces

  generateObjectResolver(node: GraphQLObjectType) {
    const fields = Object.values(node.getFields());

    return `${this.commonCodeGenerator.generateDescription(node)}
      export interface R${node.name}<TContext> {
        ${this.generateIsTypeOf(node)}
        ${this.join(fields.map((it) => this.generateFieldResolver(it, node)))}
      }`;
  }

  generateInterfaceResolver(node: GraphQLInterfaceType) {
    const fields = Object.values(node.getFields());

    return `${this.commonCodeGenerator.generateDescription(node)}
      export interface R${node.name}<TContext> {
        ${this.generateResolveType(node)}
        ${this.join(fields.map((it) => this.generateFieldResolver(it, node)))}
      }`;
  }

  generateUnionResolver(node: GraphQLUnionType) {
    return `${this.commonCodeGenerator.generateDescription(node)}
      export interface R${node.name}<TContext> {
        ${this.generateResolveType(node)}
      }`;
  }

  generateIsTypeOf(node: GraphQLObjectType) {
    return `__isTypeOf?: (
      source: ${this.commonCodeGenerator.generateNamedOutputRef(node)},
      context: TContext,
      info: GraphQLResolveInfo
    ) => boolean;`;
  }

  generateResolveType(node: GraphQLInterfaceType | GraphQLUnionType) {
    return `__resolveType?: (
      source: ${this.commonCodeGenerator.generateNamedOutputRef(node)},
      context: TContext,
      info: GraphQLResolveInfo
    ) => string;`;
  }

  generateFieldResolver(
    field: GraphQLField<unknown, unknown>,
    parent: GraphQLInterfaceType | GraphQLObjectType
  ) {
    const tResult = this.commonCodeGenerator.generateOutputRef(field.type);

    return `${this.commonCodeGenerator.generateFieldDescription(field)}
      ${field.name}?: (
        source: ${this.commonCodeGenerator.generateNamedOutputRef(parent)},
        args: ${this.generateArgsRef(field, parent)},
        context: TContext,
        info: GraphQLResolveInfo
      ) => AsyncResult<${tResult}>`;
  }

  // argument types

  generateArgs(
    field: GraphQLField<unknown, unknown>,
    object: GraphQLObjectType | GraphQLInterfaceType
  ) {
    if (field.args.length > 0) {
      return `export interface ${this.generateArgsName(field, object)} {
        ${this.join(
          field.args.map((it) =>
            this.commonCodeGenerator.generateInputField(it)
          )
        )}
      }`;
    }
  }

  generateArgsRef(
    field: GraphQLField<unknown, unknown>,
    object: GraphQLObjectType | GraphQLInterfaceType
  ) {
    return field.args.length > 0
      ? this.generateArgsName(field, object)
      : "Record<string, never>";
  }

  generateArgsName(
    field: GraphQLField<unknown, unknown>,
    object: GraphQLObjectType | GraphQLInterfaceType
  ) {
    return `${object.name}${this.firstToUpper(field.name)}Args`;
  }

  // enum resolvers

  generateEnumResolvers() {
    const parts: string[] = [];
    const types = Object.values(this.schema.getTypeMap());

    for (const type of types) {
      if (isEnumType(type)) {
        parts.push(this.generateEnumResolver(type));
      }
    }

    return this.join(parts);
  }

  generateEnumResolver(node: GraphQLEnumType) {
    return `${this.commonCodeGenerator.generateDescription(node)}
      export interface E${node.name} {
        ${this.join(
          node
            .getValues()
            .map((it) => this.generateEnumValueResolver(it, node)),
          ",\n"
        )}
      }`;
  }

  generateEnumValueResolver(node: GraphQLEnumValue, parent: GraphQLEnumType) {
    return `${this.commonCodeGenerator.generateDescription(node)}
      ${node.name}: ${this.commonCodeGenerator.generateNamedOutputRef(parent)}`;
  }

  // directives

  generateDirectives() {
    return this.commonCodeGenerator.generateDirectives();
  }

  // util

  join(parts: (string | undefined)[], separator = "\n\n", braces?: string) {
    return this.commonCodeGenerator.join(parts, separator, braces);
  }

  firstToUpper(name: string) {
    return this.commonCodeGenerator.firstToUpper(name);
  }
}
