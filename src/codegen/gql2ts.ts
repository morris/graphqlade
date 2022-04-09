import { toError } from "../util";
import {
  CodeGenerator,
  CodeGeneratorCliOptions,
  CodeGeneratorOptions,
} from "./CodeGenerator";

export interface Gql2TsOptions
  extends CodeGeneratorOptions,
    CodeGeneratorCliOptions {
  /**
   * If true, does not exit the process on error.
   */
  noExit?: boolean;
}

export async function gql2ts(options: Gql2TsOptions) {
  const logger = options.logger ?? console;

  try {
    const codeGenerator = new CodeGenerator(options);
    await codeGenerator.cli(options);
  } catch (err) {
    logger.error(toError(err));
    if (!options.noExit) process.exit(1);
  }
}
