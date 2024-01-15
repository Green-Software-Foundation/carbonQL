import {STRINGS} from '../../../config/strings';

const {
  STRUCTURE_MALFORMED,
  NOT_INITIALIZED_MODEL,
  NOT_CONSTRUCTABLE_MODEL,
  INVALID_MODULE_PATH,
  INVALID_AGGREGATION_METHOD,
  METRIC_MISSING,
} = STRINGS;

describe('config/strings: ', () => {
  describe('STRUCTURE_MALFORMED(): ', () => {
    it('successfully appends given param to message.', () => {
      const param = 'mock-message';

      const expectedMessage = `Graph is malformed: graph.children.${param} is not valid.`;

      expect(STRUCTURE_MALFORMED(param)).toEqual(expectedMessage);
    });
  });

  describe('NOT_INITIALIZED_MODEL(): ', () => {
    it('successfully appends given param to message.', () => {
      const param = 'mock-message';

      const expectedMessage = `You're trying to use not initalized model: ${param}.`;

      expect(NOT_INITIALIZED_MODEL(param)).toEqual(expectedMessage);
    });
  });

  describe('NOT_CONSTRUCTABLE_MODEL(): ', () => {
    it('successfully appends given param to message.', () => {
      const params = {model: 'mock-model', path: 'mock-path'};

      const expectedMessage = `Provided model '${params.model}' is not constructable or does not belong to given plugin '${params.path}'.`;

      expect(NOT_CONSTRUCTABLE_MODEL(params)).toEqual(expectedMessage);
    });
  });

  describe('INVALID_MODULE_PATH(): ', () => {
    it('successfully appends given param to message.', () => {
      const param = 'mock-param';

      const expectedMessage = `Provided module path: '${param}' is invalid.`;

      expect(INVALID_MODULE_PATH(param)).toEqual(expectedMessage);
    });
  });

  describe('INVALID_AGGREGATION_METHOD(): ', () => {
    it('successfully appends given param to message.', () => {
      const param = 'mock-param';

      const expectedMessage = `Aggregation is not possible for given ${param} since method is 'none'.`;

      expect(INVALID_AGGREGATION_METHOD(param)).toEqual(expectedMessage);
    });
  });

  describe('METRIC_MISSING(): ', () => {
    it('successfully appends given param to message.', () => {
      const metric = 'mock-metric';
      const index = 0;

      const expectedMessage = `Aggregation metric ${metric} is not found in inputs[${index}].`;

      expect(METRIC_MISSING(metric, index)).toEqual(expectedMessage);
    });
  });
});
