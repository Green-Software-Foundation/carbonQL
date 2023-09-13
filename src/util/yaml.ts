import * as fs from 'fs/promises';
import * as path from 'path';

import * as YAML from 'js-yaml';

/**
 * Reads and parses `yaml` file to object.
 */
export const openYamlFileAsObject = async (filePath: string): Promise<any> => {
  const yamlFileBuffer = await fs.readFile(filePath, 'utf8');

  return YAML.load(yamlFileBuffer);
};

/**
 * Saves given `yaml` dump as a file.
 */
export const saveYamlFileAs = async (object: any, pathToFile: string) => {
  try {
    const dirPath = path.dirname(pathToFile);
    await fs.mkdir(dirPath, {recursive: true});
    const yamlString = YAML.dump(object, {noRefs: true});

    return fs.writeFile(pathToFile, yamlString);
  } catch (error) {
    console.error(error);
  }
};

/**
 * Checks if given `fileName` is yaml.
 */
export const checkIfFileIsYaml = (fileName: string) => {
  const yamlFileTypes = ['yaml', 'yml'];
  const splittedParts = fileName.split('.');
  const lastIndex = splittedParts.length - 1;
  const extension = splittedParts[lastIndex];

  return yamlFileTypes.includes(extension);
};
