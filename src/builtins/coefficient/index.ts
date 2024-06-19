import {z} from 'zod';
import {ERRORS} from '@grnsft/if-core/utils';
import {
  CoefficientConfig,
  ExecutePlugin,
  PluginParams,
} from '@grnsft/if-core/types';

import {validate} from '../../util/validations';

import {STRINGS} from '../../config';

const {GlobalConfigError} = ERRORS;
const {MISSING_GLOBAL_CONFIG} = STRINGS;

export const Coefficient = (globalConfig: CoefficientConfig): ExecutePlugin => {
  const metadata = {
    kind: 'execute',
  };

  /**
   * Calculate the product of each input parameter.
   */
  const execute = (inputs: PluginParams[]) => {
    const safeGlobalConfig = validateGlobalConfig();
    const inputParameter = safeGlobalConfig['input-parameter'];
    const outputParameter = safeGlobalConfig['output-parameter'];
    const coefficient = safeGlobalConfig['coefficient'];

    return inputs.map(input => {
      return {
        ...input,
        [outputParameter]: calculateProduct(input, inputParameter, coefficient),
      };
    });
  };

  /**
   * Calculates the product of the energy components.
   */
  const calculateProduct = (
    input: PluginParams,
    inputParameter: string,
    coefficient: number
  ) => input[inputParameter] * coefficient;

  /**
   * Checks global config value are valid.
   */
  const validateGlobalConfig = () => {
    if (!globalConfig) {
      throw new GlobalConfigError(MISSING_GLOBAL_CONFIG);
    }

    const globalConfigSchema = z.object({
      coefficient: z.number(),
      'input-parameter': z.string().min(1),
      'output-parameter': z.string().min(1),
    });

    return validate<z.infer<typeof globalConfigSchema>>(
      globalConfigSchema,
      globalConfig
    );
  };

  return {
    metadata,
    execute,
  };
};
