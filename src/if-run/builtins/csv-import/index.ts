/* eslint-disable eqeqeq */
import {readFile} from 'fs/promises';
import axios from 'axios';
import {z} from 'zod';
import {parse} from 'csv-parse/sync';

import {ConfigParams, PluginParams} from '@grnsft/if-core/types';
import {PluginFactory} from '@grnsft/if-core/interfaces';
import {ERRORS, validate} from '@grnsft/if-core/utils';

import {STRINGS} from '../../config';

const {
  FILE_FETCH_FAILED,
  FILE_READ_FAILED,
  MISSING_CSV_COLUMN,
  MISSING_CONFIG,
} = STRINGS;

const {
  FetchingFileError,
  ReadFileError,
  MissingCSVColumnError,
  ConfigError,
  CSVParseError,
} = ERRORS;

export const CSVImport = PluginFactory({
  configValidation: (config: ConfigParams) => {
    if (!config || !Object.keys(config)?.length) {
      throw new ConfigError(MISSING_CONFIG);
    }

    const configSchema = z.object({
      filepath: z.string(),
      output: z
        .string()
        .or(z.array(z.string()))
        .or(z.array(z.array(z.string()))),
    });

    return validate<z.infer<typeof configSchema>>(configSchema, config);
  },
  implementation: async (inputs: PluginParams[], config: ConfigParams) => {
    /**
     * 1. Tries to retrieve given file (with url or local path).
     * 2. Parses given CSV.
     * 3. Filters requested information from CSV.
     */
    const {filepath, output} = config;
    const file = await retrieveFile(filepath);
    const parsedCSV = parseCSVFile(file);

    const result = parsedCSV?.map((input: PluginParams) =>
      filterOutput(input, output)
    );

    return [...inputs, ...result];
  },
});

/**
 * Checks if given string is URL.
 */
const isURL = (filepath: string) => {
  try {
    new URL(filepath);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Checks if given `filepath` is url, then tries to fetch it.
 * Otherwise tries to read file.
 */
const retrieveFile = async (filepath: string) => {
  if (isURL(filepath)) {
    const {data} = await axios.get(filepath).catch(error => {
      throw new FetchingFileError(
        FILE_FETCH_FAILED(filepath, error.response.message)
      );
    });

    return data;
  }

  return readFile(filepath).catch(error => {
    throw new ReadFileError(FILE_READ_FAILED(filepath, error));
  });
};

/**
 * Checks if value is invalid: `undefined`, `null` or an empty string, then sets `nan` instead.
 */
const setNanValue = (value: any) =>
  value == null || value === '' ? 'nan' : value;

/**
 * Converts empty values to `nan`.
 */
const nanifyEmptyValues = (object: any) => {
  if (typeof object === 'object') {
    const keys = Object.keys(object);

    keys.forEach(key => {
      const value = object[key];
      object[key] = setNanValue(value);
    });

    return object;
  }

  return setNanValue(object);
};

/**
 * If `field` is missing from `object`, then reject with error.
 * Otherwise nanify empty values and return data.
 */
const fieldAccessor = (field: string, object: any) => {
  if (!(`${field}` in object)) {
    throw new MissingCSVColumnError(MISSING_CSV_COLUMN(field));
  }

  return nanifyEmptyValues(object[field]);
};

/**
 * 1. If output is anything, then removes query data from csv record to escape duplicates.
 * 2. Otherwise checks if it's a miltidimensional array, then grabs multiple fields ().
 * 3. If not, then returns single field.
 * 4. In case if it's string, then
 */
const filterOutput = (
  dataFromCSV: any,
  output: string | string[] | string[][]
) => {
  if (output === '*') {
    return nanifyEmptyValues(dataFromCSV);
  }

  if (Array.isArray(output)) {
    /** Check if it's a multidimensional array. */
    if (Array.isArray(output[0])) {
      const result: any = {};

      output.forEach(outputField => {
        /** Check if there is no renaming request, then export as is */
        const outputTitle = outputField[1] || outputField[0];
        result[outputTitle] = fieldAccessor(outputField[0], dataFromCSV);
      });

      return result;
    }

    const outputTitle = output[1] || output[0];

    return {
      [outputTitle as string]: fieldAccessor(output[0], dataFromCSV),
    };
  }

  return {
    [output]: fieldAccessor(output, dataFromCSV),
  };
};

/**
 * Parses CSV file.
 */
const parseCSVFile = (file: string | Buffer) => {
  try {
    const parsedCSV: any[] = parse(file, {
      columns: true,
      skip_empty_lines: true,
      cast: true,
    });

    return parsedCSV;
  } catch (error: any) {
    console.error(error);
    throw new CSVParseError(error);
  }
};
