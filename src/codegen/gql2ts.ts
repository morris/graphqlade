import {
  CodeGenerator,
  CodeGeneratorOptions,
  CodeGeneratorCliOptions,
} from "./CodeGenerator";

export async function gql2ts(
  options: CodeGeneratorOptions &
    CodeGeneratorCliOptions & { argv?: string[]; noExit?: boolean }
) {
  const logger = options.logger ?? console;

  try {
    const codeGenerator = new CodeGenerator(options);
    await codeGenerator.cli(options);
  } catch (err) {
    logger.error(err.stack);
    if (!options.noExit) process.exit(1);
  }
}
