import {
  CodeGenerator,
  CodeGeneratorOptions,
  CodeGeneratorCliOptions,
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
    logger.error(err.stack);
    if (!options.noExit) process.exit(1);
  }
}
