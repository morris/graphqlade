import {
  GraphQLDirective,
  GraphQLEnumType,
  GraphQLEnumValue,
  GraphQLField,
  GraphQLInputField,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLType,
  isListType,
  isNonNullType,
} from "graphql";
import { ImportCodeGenerator } from "./ImportCodeGenerator";

export interface CommonCodeGeneratorOptions {
  schema: GraphQLSchema;
}

export interface TsDirective {
  type: string;
  inputType?: string;
  from?: string;
}

export interface TypeMapping {
  gqlType: string;
  tsType: string;
  tsInputType?: string;
  from?: string;
}

export class CommonCodeGenerator {
  protected schema: GraphQLSchema;
  protected typeMap = new Map<string, TypeMapping>();

  constructor(options: CommonCodeGeneratorOptions) {
    this.schema = options.schema;

    this.addTypeMapping({ gqlType: "Int", tsType: "number" });
    this.addTypeMapping({ gqlType: "Float", tsType: "number" });
    this.addTypeMapping({ gqlType: "String", tsType: "string" });
    this.addTypeMapping({ gqlType: "Boolean", tsType: "boolean" });
    this.addTypeMapping({ gqlType: "ID", tsType: "string" });
  }

  // type maps

  addTypeMapping(typeMapping: TypeMapping) {
    this.typeMap.set(typeMapping.gqlType, typeMapping);
  }

  addTypeMapImports(importCodeGenerator: ImportCodeGenerator) {
    for (const [, typeMapping] of this.typeMap) {
      if (typeMapping.from) {
        importCodeGenerator.addImport({
          names: [typeMapping.tsType],
          from: typeMapping.from,
        });

        if (typeMapping.tsInputType) {
          importCodeGenerator.addImport({
            names: [typeMapping.tsInputType],
            from: typeMapping.from,
          });
        }
      }
    }
  }

  // header

  generateHeader() {
    return "/* eslint-disable */";
  }

  // helpers

  generateHelpers() {
    return "export type Maybe<T> = T | null | undefined;";
  }

  // directives

  generateDirectives() {
    return this.join(
      this.schema
        .getDirectives()
        .map((node) => this.generateDirectiveInterface(node))
    );
  }

  generateDirectiveInterface(node: GraphQLDirective) {
    if (node.args.length > 0) {
      return `export interface ${this.generateDirectiveInterfaceName(node)} {
        ${this.join(node.args.map((it) => this.generateInputField(it)))}
      }`;
    }

    return "";
  }

  generateDirectiveInterfaceName(node: GraphQLDirective) {
    return `${this.firstToUpper(node.name)}Directive`;
  }

  // input objects

  generateInputObject(node: GraphQLInputObjectType) {
    return `${this.generateDescription(node)}
      export interface T${node.name} {
        ${this.join(
          Object.values(node.getFields()).map((it) =>
            this.generateInputField(it)
          )
        )}
      }`;
  }

  generateInputField(node: GraphQLInputField) {
    return `${this.generateFieldDescription(node)}
      ${node.name}${isNonNullType(node.type) ? "" : "?"}:
        ${this.generateInputRef(node.type, false)};`;
  }

  // enums

  generateEnum(node: GraphQLEnumType) {
    return `${this.generateDescription(node)}
      export enum T${node.name} {
        ${this.join(
          node.getValues().map((it) => this.generateEnumValue(it)),
          ",\n"
        )}
      }`;
  }

  generateEnumValue(node: GraphQLEnumValue) {
    return `${this.generateDescription(node)}
      ${node.name} = ${JSON.stringify(node.value)}`;
  }

  // type refs

  generateOutputRef(node: GraphQLOutputType, optional = true): string {
    if (isNonNullType(node)) {
      return this.generateOutputRef(node.ofType, false);
    } else if (isListType(node)) {
      return this.generateMaybe(
        `Array<${this.generateOutputRef(node.ofType, true)}>`,
        optional
      );
    } else {
      return this.generateMaybe(this.generateNamedOutputRef(node), optional);
    }
  }

  generateNamedOutputRef(node: GraphQLNamedType) {
    const typeMapping = this.typeMap.get(node.name);

    if (typeMapping) return typeMapping.tsType;

    return `T${node.name}`;
  }

  generateInputRef(node: GraphQLInputType, optional = true): string {
    if (isNonNullType(node)) {
      return this.generateInputRef(node.ofType, false);
    } else if (isListType(node)) {
      return this.generateMaybe(
        `Array<${this.generateInputRef(node.ofType)}>`,
        optional
      );
    } else {
      return this.generateMaybe(this.generateNamedInputRef(node), optional);
    }
  }

  generateNamedInputRef(
    node: GraphQLInputObjectType | GraphQLEnumType | GraphQLScalarType
  ) {
    const typeMapping = this.typeMap.get(node.name);

    if (typeMapping) {
      return typeMapping.tsInputType
        ? typeMapping.tsInputType
        : typeMapping.tsType;
    }

    return `T${node.name}`;
  }

  // descriptions and comments

  generateDescription(node: GraphQLNamedType | GraphQLEnumValue) {
    return node.description ? this.generateComment(node.description) : "";
  }

  generateFieldDescription(
    node: GraphQLField<unknown, unknown> | GraphQLInputField
  ) {
    const t = this.generateTypeForDescription(node.type);
    const tt = t ? `(${t}) ` : "";
    const ttt = `${tt}${node.description ?? ""}`;

    return this.generateComment(ttt);
  }

  generateTypeForDescription(node: GraphQLType): string {
    if (isNonNullType(node)) {
      return this.generateTypeForDescription(node.ofType);
    } else if (isListType(node)) {
      const t = this.generateTypeForDescription(node.ofType);

      return t ? `Array<${t}>` : "";
    } else {
      if (this.typeMap.has(node.name)) {
        return `${node.name}`;
      } else {
        return "";
      }
    }
  }

  generateComment(text: string) {
    if (text.length === 0) {
      return "";
    }

    const lines = text.split(/\n/g).map((line) => `* ${line}`);

    return `/**\n${lines.join("\n")}\n*/`;
  }

  // helpers

  generateMaybe(typeRef: string, optional: boolean) {
    return optional ? `Maybe<${typeRef}>` : typeRef;
  }

  // util

  join(parts: (string | undefined)[], separator = "\n\n", braces?: string) {
    const joined = parts
      .filter((part) => typeof part === "string" && part.length > 0)
      .join(separator);

    if (braces && joined.length > 0) {
      return `${braces.charAt(0)}${joined}${braces.charAt(1)}`;
    }

    return joined;
  }

  firstToUpper(name: string) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
}
