import moment = require('moment');
import {extendMoment} from 'moment-range';
const momentRange = extendMoment(moment);

import {STRINGS} from '../config';

import {ERRORS} from '../util/errors';
import {UnitsDealer} from '../util/units-dealer';

import {ModelParams, ModelPluginInterface} from '../types/model-interface';
import {TimeNormalizerConfig} from '../types/time-sync';
import {UnitsDealerUsage} from '../types/units-dealer';
import {UnitKeyName} from '../types/units';

const {InputValidationError} = ERRORS;

const {INVALID_TIME_NORMALIZATION, INVALID_TIME_INTERVAL} = STRINGS;

export class TimeSyncModel implements ModelPluginInterface {
  startTime: string | undefined;
  endTime: string | undefined;
  interval = 1;

  /**
   * Setups basic configuration.
   */
  async configure(params: TimeNormalizerConfig): Promise<ModelPluginInterface> {
    this.startTime = params['start-time'];
    this.endTime = params['end-time'];
    this.interval = params.interval;

    return this;
  }

  /**
   * Calculates minimal factor.
   */
  private convertPerInterval = (value: number, duration: number) =>
    value / duration;

  /**
   * Normalize time per given second.
   */
  private normalizeTimePerSecond = (currentRoundMoment: string, i: number) => {
    const thisMoment = moment(currentRoundMoment).milliseconds(0);

    return thisMoment.add(i, 'second');
  };

  /**
   * Input flattener.
   */
  private flattenInput(
    input: ModelParams,
    dealer: UnitsDealerUsage,
    i: number
  ) {
    const inputKeys = Object.keys(input) as UnitKeyName[];
    return inputKeys.reduce((acc, key) => {
      const method = dealer.askToGiveMethodFor(key);

      if (key === 'timestamp') {
        const perSecond = this.normalizeTimePerSecond(input.timestamp, i);
        acc[key] = moment(perSecond).milliseconds(0).toISOString();

        return acc;
      }

      if (key === 'duration') {
        acc[key] = 1; /** @todo use user defined resolution later */

        return acc;
      }
      acc[key] =
        method === 'sum'
          ? this.convertPerInterval(input[key], input['duration'])
          : input[key];

      return acc;
    }, {} as ModelParams);
  }

  /**
   * Populates object to fill the gaps in observational timeline using zeroish values.
   */
  private fillWithZeroishInput(
    input: ModelParams,
    missingTimestamp: number,
    dealer: UnitsDealerUsage
  ) {
    const metrics = Object.keys(input) as UnitKeyName[];

    return metrics.reduce((acc, metric) => {
      if (metric === 'timestamp') {
        acc[metric] = moment(missingTimestamp).milliseconds(0).toISOString();

        return acc;
      }

      if (metric === 'duration') {
        acc[
          metric
        ] = 1; /** @todo later will be changed to user defined interval */

        return acc;
      }

      if (metric === 'time-reserved') {
        acc[metric] = acc['duration'];

        return acc;
      }

      const method = dealer.askToGiveMethodFor(metric);
      acc[method] = method === 'avg' || method === 'sum' ? 0 : input[metric];

      return acc;
    }, {} as ModelParams);
  }

  /**
   * Validates `startTime`, `endTime` and `interval` params.
   */
  private validateParams() {
    if (!this.startTime || !this.endTime) {
      throw new InputValidationError(INVALID_TIME_NORMALIZATION);
    }

    if (this.startTime > this.endTime) {
      throw new InputValidationError(INVALID_TIME_NORMALIZATION);
    }

    if (!this.interval) {
      throw new InputValidationError(INVALID_TIME_INTERVAL);
    }
  }

  private checkPadding(inputs: ModelParams[]): boolean[] {
    const out = [false, false];
    if (this.startTime !== undefined) {
      const startDiffInSeconds =
        moment(inputs[0].timestamp).diff(moment(this.startTime)) / 1000;
      const endDiffInSeconds =
        moment(inputs[inputs.length - 1].timestamp)
          .add(inputs[inputs.length - 1].duration, 'seconds')
          .diff(moment(this.endTime)) / 1000;
      if (startDiffInSeconds > 0) {
        out[0] = true;
      }
      if (endDiffInSeconds < 0) {
        out[1] = true;
      }
    }
    return out;
  }

  private async padInputs(
    inputs: ModelParams[],
    pad: boolean[]
  ): Promise<ModelParams[]> {
    if (pad[0]) {
      const dateRange = momentRange.range(
        moment(this.startTime),
        moment(inputs[0].timestamp).subtract(1, 'second')
      );
      for (const second of dateRange.by('second')) {
        // @todo apply zero-fill logic to create this object (any fields with aggregation-method == sum or avg should be zeros, others copied from inputs[0])
        inputs.push({timestamp: second.toISOString(), duration: 1, carbon: 0});
      }
    }
    if (pad[1]) {
      const dateRange = momentRange.range(
        moment(inputs[inputs.length - 1].timestamp).add(
          inputs[inputs.length - 1].duration + 1,
          'seconds'
        ),
        moment(this.endTime)
      );
      for (const second of dateRange.by('second')) {
        // @todo apply zero-fill logic to create this object (any fields with aggregation-method == sum or avg should be zeros, others copied from inputs[0])
        inputs.push({timestamp: second.toISOString(), duration: 1, carbon: 0});
      }
    }
    return inputs.sort((a, b) => moment(a.timestamp).diff(moment(b.timestamp)));
  }

  /**
   * Normalizes provided time window according to time configuration.
   */
  async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
    this.validateParams();

    const dealer = await UnitsDealer();
    const pad = this.checkPadding(inputs);
    const paddedInputs = await this.padInputs(inputs, pad);

    return paddedInputs
      .reduce((acc, input, index) => {
        const currentMoment = moment(input.timestamp);

        /**
         * Checks if not the first input, then check consistency with previous ones.
         */
        if (index > 0) {
          const previousInput = inputs[index - 1];
          const previousInputTimestamp = moment(previousInput.timestamp);
          const compareableTime = previousInputTimestamp.add(
            previousInput.duration,
            'second'
          );

          const timelineGapSize = currentMoment.diff(compareableTime, 'second');

          /**
           * Checks if there is gap in timeline.
           */
          if (timelineGapSize > 0) {
            for (
              let missingTimestamp = compareableTime.valueOf();
              missingTimestamp <= currentMoment.valueOf() - 1000;
              missingTimestamp += 1000
            ) {
              const filledGap = this.fillWithZeroishInput(
                input,
                missingTimestamp,
                dealer
              );
              acc.push(filledGap);
            }
          }
        }

        /**
         * Brake down current observation.
         */
        for (let i = 0; i < input.duration; i++) {
          const normalizedInput = this.flattenInput(input, dealer, i);

          acc.push(normalizedInput);
        }

        return acc;
      }, [] as ModelParams[])
      .sort((a, b) => moment(a.timestamp).diff(moment(b.timestamp)));
  }
}
