import {DateTime, Interval} from 'luxon';

import {STRINGS, PARAMETERS} from '../config';

import {ERRORS} from '../util/errors';
import {getAggregationMethod} from '../util/param-selectors';

import {ModelParams, ModelPluginInterface} from '../types/model-interface';
import {PaddingReceipt, TimeNormalizerConfig} from '../types/time-sync';

const {InputValidationError} = ERRORS;

const {
  INVALID_TIME_NORMALIZATION,
  INVALID_TIME_INTERVAL,
  INVALID_OBSERVATION_OVERLAP,
  AVOIDING_PADDING_BY_EDGES,
} = STRINGS;

export class TimeSyncModel implements ModelPluginInterface {
  private startTime!: string;
  private endTime!: string;
  private interval = 1;
  private allowPadding = true;

  /**
   * Setups basic configuration.
   */
  async configure(params: TimeNormalizerConfig): Promise<ModelPluginInterface> {
    this.startTime = params['start-time'];
    this.endTime = params['end-time'];
    this.interval = params.interval;
    this.allowPadding = params['allow-padding'];

    return this;
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

  /**
   * Calculates minimal factor.
   */
  private convertPerInterval = (value: number, duration: number) =>
    value / duration;

  /**
   * Normalize time per given second.
   */
  private normalizeTimePerSecond = (currentRoundMoment: string, i: number) => {
    const thisMoment = DateTime.fromISO(currentRoundMoment).startOf('second');
    return thisMoment.plus({seconds: i});
  };
  /**
   * Barkes down input per minimal time unit.
   */
  private breakDownInput(input: ModelParams, i: number) {
    const inputKeys = Object.keys(input);

    return inputKeys.reduce((acc, key) => {
      const method = getAggregationMethod(key, PARAMETERS);

      if (key === 'timestamp') {
        const perSecond = this.normalizeTimePerSecond(input.timestamp, i);
        acc[key] = perSecond.toUTC().toISO();

        return acc;
      }

      /** @todo use user defined resolution later */
      if (key === 'duration') {
        acc[key] = 1;

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
  private fillWithZeroishInput(input: ModelParams, missingTimestamp: number) {
    const metrics = Object.keys(input);

    return metrics.reduce((acc, metric) => {
      if (metric === 'timestamp') {
        acc[metric] = DateTime.fromMillis(missingTimestamp)
          .startOf('second')
          .toUTC()
          .toISO();

        return acc;
      }

      /** @todo later will be changed to user defined interval */
      if (metric === 'duration') {
        acc[metric] = 1;

        return acc;
      }

      if (metric === 'time-reserved') {
        acc[metric] = acc['duration'];

        return acc;
      }

      const method = getAggregationMethod(metric, PARAMETERS);

      if (method === 'avg' || method === 'sum') {
        acc[metric] = 0;

        return acc;
      }

      acc[metric] = input[metric];

      return acc;
    }, {} as ModelParams);
  }

  /**
   * Checks if `error on padding` is enabled and padding is needed. If so, then throws error.
   */
  private validatePadding(pad: PaddingReceipt): void {
    const {start, end} = pad;
    const isPaddingNeeded = start || end;
    if (!this.allowPadding && isPaddingNeeded) {
      throw new InputValidationError(AVOIDING_PADDING_BY_EDGES(start, end));
    }
  }

  /**
   * Checks if padding is needed either at start of the timeline or the end and returns status.
   */
  private checkForPadding(inputs: ModelParams[]): PaddingReceipt {
    const startDiffInSeconds = DateTime.fromISO(inputs[0].timestamp)
      .diff(DateTime.fromISO(this.startTime))
      .as('seconds');

    const lastInput = inputs[inputs.length - 1];

    const endDiffInSeconds = DateTime.fromISO(lastInput.timestamp)
      .plus({second: lastInput.duration})
      .diff(DateTime.fromISO(this.endTime))
      .as('seconds');

    return {
      start: startDiffInSeconds > 0,
      end: endDiffInSeconds < 0,
    };
  }

  /**
   * Iterates over given inputs frame, meanwhile checking if aggregation method is `sum`, then calculates it.
   * For methods is `avg` and `none` calculating average of the frame.
   */
  private resampleInputFrame = (inputsInTimeslot: ModelParams[]) => {
    return inputsInTimeslot.reduce((acc, input, index, inputs) => {
      const metrics = Object.keys(input);

      metrics.forEach(metric => {
        const method = getAggregationMethod(metric, PARAMETERS);
        acc[metric] = acc[metric] ?? 0;

        if (metric === 'timestamp') {
          acc[metric] = inputs[0][metric];

          return;
        }

        if (method === 'sum') {
          acc[metric] += input[metric];

          return;
        }

        if (method === 'none') {
          acc[metric] = input[metric];

          return;
        }

        /**
         * If timeslot contains records more than one, then divide each metric by the timeslot length,
         *  so that their sum yields the timeslot average.
         */
        if (
          inputsInTimeslot.length > 1 &&
          index === inputsInTimeslot.length - 1
        ) {
          acc[metric] /= inputsInTimeslot.length;

          return;
        }

        acc[metric] += input[metric];
      });

      return acc;
    }, {} as ModelParams);
  };

  /**
   * Takes each array frame with interval length, then aggregating them together as from units.yaml file.
   */
  private resampleInputs(inputs: ModelParams[]) {
    return inputs.reduce((acc: ModelParams[], _input, index, inputs) => {
      const frameStart = index * this.interval;
      const frameEnd = (index + 1) * this.interval;
      const inputsFrame = inputs.slice(frameStart, frameEnd);

      const resampledInput = this.resampleInputFrame(inputsFrame);

      /** Checks if resampled input is not empty, then includes in result. */
      if (Object.keys(resampledInput).length > 0) {
        acc.push(resampledInput);
      }

      return acc;
    }, [] as ModelParams[]);
  }

  /**
   * Pads zeroish inputs from the beginning or at the end of the inputs if needed.
   */
  private padInputs(inputs: ModelParams[], pad: PaddingReceipt): ModelParams[] {
    const {start, end} = pad;
    const paddedFromBeginning = [];

    if (start) {
      const dateRange = Interval.fromDateTimes(
        DateTime.fromISO(this.startTime),
        DateTime.fromISO(inputs[0].timestamp)
      );
      for (const interval of dateRange.splitBy({second: 1})) {
        paddedFromBeginning.push(
          // as far as I can tell, start will never be null
          // because if we pass an invalid start/endDate to
          // Interval, we get a zero length array as the range
          this.fillWithZeroishInput(inputs[0], interval.start?.toMillis() || 0)
        );
      }
    }

    const paddedArray = paddedFromBeginning.concat(inputs);

    if (end) {
      const lastInput = inputs[inputs.length - 1];
      const lastInputEnd = DateTime.fromISO(lastInput.timestamp).plus({
        seconds: lastInput.duration,
      });
      const dateRange = Interval.fromDateTimes(
        lastInputEnd,
        DateTime.fromISO(this.endTime).plus({seconds: 1})
      );
      for (const interval of dateRange.splitBy({second: 1})) {
        paddedArray.push(
          // as far as I can tell, start will never be null
          // because if we pass an invalid start/endDate to
          // Interval, we get a zero length array as the range
          this.fillWithZeroishInput(lastInput, interval.start?.toMillis() || 0)
        );
      }
    }

    return paddedArray;
  }

  /*
   * Checks if input's timestamp is included in global specified period then leaves it, otherwise.
   */
  private trimInputsByGlobalTimeline(inputs: ModelParams[]): ModelParams[] {
    return inputs.reduce((acc: ModelParams[], item) => {
      const {timestamp} = item;

      if (
        DateTime.fromISO(timestamp) >= DateTime.fromISO(this.startTime) &&
        DateTime.fromISO(timestamp) <= DateTime.fromISO(this.endTime)
      ) {
        acc.push(item);
      }

      return acc;
    }, [] as ModelParams[]);
  }

  /**
   * Normalizes provided time window according to time configuration.
   */
  async execute(inputs: ModelParams[]): Promise<ModelParams[]> {
    this.validateParams();

    const pad = this.checkForPadding(inputs);
    this.validatePadding(pad);
    const paddedInputs = this.padInputs(inputs, pad);

    const flattenInputs = paddedInputs.reduce(
      (acc: ModelParams[], input, index) => {
        const currentMoment = DateTime.fromISO(input.timestamp);

        /** Checks if not the first input, then check consistency with previous ones. */
        if (index > 0) {
          const previousInput = paddedInputs[index - 1];
          const previousInputTimestamp = DateTime.fromISO(
            previousInput.timestamp
          );

          /** Checks for timestamps overlap. */
          if (
            DateTime.fromISO(previousInput.timestamp).plus({
              seconds: previousInput.duration,
            }) > currentMoment
          ) {
            throw new InputValidationError(INVALID_OBSERVATION_OVERLAP);
          }

          const compareableTime = previousInputTimestamp.plus({
            seconds: previousInput.duration,
          });

          const timelineGapSize = currentMoment
            .diff(compareableTime)
            .as('seconds');

          /** Checks if there is gap in timeline. */
          if (timelineGapSize > 1) {
            for (
              let missingTimestamp = compareableTime.toMillis();
              missingTimestamp <= currentMoment.toMillis() - 1000;
              missingTimestamp += 1000
            ) {
              const filledGap = this.fillWithZeroishInput(
                input,
                missingTimestamp
              );

              acc.push(filledGap);
            }
          }
        }

        /** Break down current observation. */
        for (let i = 0; i < input.duration; i++) {
          const normalizedInput = this.breakDownInput(input, i);

          acc.push(normalizedInput);
        }

        return this.trimInputsByGlobalTimeline(acc);
      },
      [] as ModelParams[]
    );

    const sortedInputs = flattenInputs.sort((a, b) =>
      DateTime.fromISO(a.timestamp)
        .diff(DateTime.fromISO(b.timestamp))
        .as('seconds')
    );

    return this.resampleInputs(sortedInputs);
  }
}
