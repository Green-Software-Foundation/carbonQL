import path = require('path');

import { openYamlFileAsObject } from './yaml';

import { Units, UnitKeyName } from '../types/units';

/**
 * Gets units file as an object.
 */
const getUnitsFile = () =>
  openYamlFileAsObject<Units>(
    path.normalize(`${__dirname}/../config/units.yaml`)
  );

/**
 * Units dealer 😎 🃏.
 */
export const UnitsDealer = async () => {
  const unitsStack = await getUnitsFile();

  return {
    /**
     * Returns aggregation method for given `unitName`. If doesn't exist then returns value `sum`.
     */
    askToGiveMethodFor: (unitName: UnitKeyName) => {
      if (unitsStack[unitName]) {
        return unitsStack[unitName].aggregation;
      }

      return 'sum';
    },
  };
};
