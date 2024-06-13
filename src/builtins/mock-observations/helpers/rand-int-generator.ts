import {ERRORS} from '../../../util/errors';

import {STRINGS} from '../../../config';

import {Generator} from '../interfaces';
import {RandIntGeneratorParams} from '../types';

const {GlobalConfigError} = ERRORS;

const {MISSING_GLOBAL_CONFIG, MISSING_MIN_MAX, INVALID_MIN_MAX, INVALID_NAME} =
  STRINGS;

export const RandIntGenerator = (
  name: string,
  config: Record<string, any>
): Generator => {
  const next = () => ({
    [validatedName]: generateRandInt(getFieldToPopulate()),
  });

  const validateName = (name: string | null): string => {
    if (!name || name.trim() === '') {
      throw new GlobalConfigError(INVALID_NAME);
    }

    return name;
  };

  const validateConfig = (
    config: Record<string, any>
  ): {min: number; max: number} => {
    if (!config || Object.keys(config).length === 0) {
      throw new GlobalConfigError(MISSING_GLOBAL_CONFIG);
    }

    if (!config.min || !config.max) {
      throw new GlobalConfigError(MISSING_MIN_MAX);
    }

    if (config.min >= config.max) {
      throw new GlobalConfigError(INVALID_MIN_MAX(validatedName));
    }

    return {min: config.min, max: config.max};
  };

  const validatedName = validateName(name);
  const validatedConfig = validateConfig(config);

  const getFieldToPopulate = () => ({
    name: validatedName,
    min: validatedConfig.min,
    max: validatedConfig.max,
  });

  const generateRandInt = (
    randIntGenerator: RandIntGeneratorParams
  ): number => {
    const randomNumber = Math.random();
    const scaledNumber =
      randomNumber * (randIntGenerator.max - randIntGenerator.min) +
      randIntGenerator.min;

    return Math.trunc(scaledNumber);
  };

  return {
    next,
  };
};
