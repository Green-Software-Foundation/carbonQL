import {z} from 'zod';
import {
  ExecutePlugin,
  PluginParametersMetadata,
  PluginParams,
  SubtractConfig,
} from '@grnsft/if-core/types';
import {ERRORS} from '@grnsft/if-core/utils';

import {validate} from '../../../common/util/validations';

import {STRINGS} from '../../config';

const {ConfigError} = ERRORS;
const {MISSING_CONFIG} = STRINGS;

export const Subtract = (
  config: SubtractConfig,
  parametersMetadata: PluginParametersMetadata
): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
    inputs: parametersMetadata?.inputs,
    outputs: parametersMetadata?.outputs,
  };

  /**
   * Checks config value are valid.
   */
  const validateConfig = () => {
    if (!config) {
      throw new ConfigError(MISSING_CONFIG);
    }

    const configSchema = z.object({
      'input-parameters': z.array(z.string()),
      'output-parameter': z.string().min(1),
    });

    return validate<z.infer<typeof configSchema>>(configSchema, config);
  };

  /**
   * Checks for required fields in input.
   */
  const validateSingleInput = (
    input: PluginParams,
    inputParameters: string[]
  ) => {
    const inputData = inputParameters.reduce(
      (acc, param) => {
        acc[param] = input[param];

        return acc;
      },
      {} as Record<string, number>
    );

    const validationSchema = z.record(z.string(), z.number());

    validate(validationSchema, inputData);

    return input;
  };

  /**
   * Subtract items from inputParams[1..n] from inputParams[0] and write the result in a new param outputParam.
   */
  const execute = (inputs: PluginParams[]): PluginParams[] => {
    const {
      'input-parameters': inputParameters,
      'output-parameter': outputParameter,
    } = validateConfig();

    return inputs.map(input => {
      validateSingleInput(input, inputParameters);

      return {
        ...input,
        [outputParameter]: calculateDiff(input, inputParameters),
      };
    });
  };

  /**
   * Calculates the diff between the 1st item in the inputs nad the rest of the items
   */
  const calculateDiff = (input: PluginParams, inputParameters: string[]) => {
    const [firstItem, ...restItems] = inputParameters;

    return restItems.reduce(
      (accumulator, metricToSubtract) => accumulator - input[metricToSubtract],
      input[firstItem] // Starting accumulator with the value of the first item
    );
  };

  return {
    metadata,
    execute,
  };
};
