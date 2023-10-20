import {IImpactModelInterface} from '../interfaces';

import {CONFIG} from '../../config';

const {MODEL_IDS} = CONFIG;
const {AVEVA} = MODEL_IDS;

export class EAvevaModel implements IImpactModelInterface {
  authParams: object | undefined; // Defined for compatibility. Not used in Aveva.
  name: string | undefined; // name of the data source
  staticParams: object | undefined; // Defined for compatibility. Not used in Aveva.

  /**
   * Defined for compatibility. Not used here.
   */
  authenticate(authParams: object): void {
    this.authParams = authParams;
  }

  /**
   * Configures the Aveva Plugin for IEF
   * @param {string} name name of the resource
   * @param {Object} staticParams static parameters for the resource
   */
  async configure(
    name: string,
    staticParams: object | undefined = undefined
  ): Promise<IImpactModelInterface> {
    this.name = name;
    this.staticParams = staticParams;

    return this;
  }

  /**
   * Calculate the total emissions for a list of observations.
   * Each Observation require:
   * @param {Object[]} observations
   * @param {number} observations[].time time to normalize to in hours
   * @param {number} observations[].pb baseline power
   * @param {number} observations[].pl measured power
   */
  async calculate(observations: object | object[] | undefined): Promise<any[]> {
    if (observations === undefined) {
      throw new Error('Required Parameters not provided');
    } else if (!Array.isArray(observations)) {
      throw new Error('Observations must be an array');
    }

    return observations.map(observation => {
      observation['energy-cpu'] =
        ((observation['pl'] - observation['pb']) * observation['time']) / 1000;

      return observation;
    });
  }

  /**
   * Returns model identifier
   */
  modelIdentifier() {
    return AVEVA;
  }
}
