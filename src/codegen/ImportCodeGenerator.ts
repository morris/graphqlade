export interface ImportDef {
  names: string[];
  from: string;
}

export class ImportCodeGenerator {
  protected imports = new Map<string, Set<string>>();

  addImport(im: ImportDef) {
    const names = this.imports.get(im.from);

    if (names) {
      for (const name of im.names) {
        names.add(name);
      }
    } else {
      this.imports.set(im.from, new Set(im.names));
    }

    return this;
  }

  generateImports() {
    return Array.from(this.imports)
      .map(
        ([from, names]) =>
          `import { ${Array.from(names).join(", ")} } from ${JSON.stringify(
            from
          )}`
      )
      .join("\n");
  }
}
