export async function canImportModule(name: string) {
  try {
    await import(name);

    return true;
  } catch (err) {
    return false;
  }
}
