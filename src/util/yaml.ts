import * as fs from 'fs/promises';
import * as path from 'path';

import * as YAML from 'js-yaml';

import {Impl} from '../types/impl';

/**
 * Reads and parses `yaml` file to object.
 */
export const openYamlFileAsObject = async (filePath: string): Promise<Impl> => {
  const yamlFileBuffer = await fs.readFile(filePath, 'utf8');

  return YAML.load(yamlFileBuffer) as Impl;
};

/**
 * Saves given `yaml` dump as a file.
 */
export const saveYamlFileAs = async (object: any, pathToFile: string) => {
  const dirPath = path.dirname(pathToFile);
  await fs.mkdir(dirPath, {recursive: true});
  const yamlString = YAML.dump(object, {noRefs: true});

  return fs.writeFile(pathToFile, yamlString);
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
