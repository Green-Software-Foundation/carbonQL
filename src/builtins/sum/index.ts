import {z} from 'zod';

import {ExecutePlugin, PluginParams} from '../../types/interface';

import {validate} from '../../util/validations';
import {ERRORS} from '../../util/errors';

import {SumConfig} from './types';

const {InputValidationError, ConfigNotFoundError} = ERRORS;

export const Sum = (globalConfig: SumConfig): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Calculate the sum of each input-paramters.
   */
  const execute = (inputs: PluginParams[]) => {
    const safeGlobalConfig = validateGlobalConfig();
    const inputParameters = safeGlobalConfig['input-parameters'];
    const outputParameter = safeGlobalConfig['output-parameter'];

    return inputs.map(input => {
      const safeInput = validateSingleInput(input, inputParameters);

      return {
        ...input,
        [outputParameter]: calculateSum(safeInput, inputParameters),
      };
    });
  };

  /**
   * Checks global config value are valid.
   */
  const validateGlobalConfig = () => {
    if (!globalConfig) {
      throw new ConfigNotFoundError('Global config is not provided.');
    }

    const globalConfigSchema = z.object({
      'input-parameters': z.array(z.string()),
      'output-parameter': z.string().min(1),
    });

    return validate<z.infer<typeof globalConfigSchema>>(
      globalConfigSchema,
      globalConfig
    );
  };

  /**
   * Checks for required fields in input.
   */
  const validateSingleInput = (
    input: PluginParams,
    inputParameters: string[]
  ) => {
    inputParameters.forEach(metricToSum => {
      if (!input[metricToSum]) {
        throw new InputValidationError(
          `${metricToSum} is missing from the input array.`
        );
      }
    });

    return input;
  };

  /**
   * Calculates the sum of the energy components.
   */
  const calculateSum = (input: PluginParams, inputParameters: string[]) =>
    inputParameters.reduce(
      (accumulator, metricToSum) => accumulator + input[metricToSum],
      0
    );

  return {
    metadata,
    execute,
  };
};
