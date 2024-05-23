import {ExportYaml} from '../../../builtins/export-yaml';
import {ERRORS} from '../../../util/errors';
import {saveYamlFileAs} from '../../../util/yaml';

import {tree, context} from '../../../__mocks__/builtins/export-csv';

jest.mock('../../../util/yaml', () => ({
  saveYamlFileAs: jest.fn(),
}));

const {ExhaustError} = ERRORS;

describe('builtins/export-yaml: ', () => {
  describe('ExportYaml: ', () => {
    const exportYaml = ExportYaml();

    describe('init ExportYaml: ', () => {
      it('initalizes object with properties.', async () => {
        expect(exportYaml).toHaveProperty('execute');
      });
    });

    describe('execute', () => {
      it('returns result with correct arguments', async () => {
        const outputPath = 'outputPath.yaml';

        await exportYaml.execute(tree, context, outputPath);

        expect(saveYamlFileAs).toHaveBeenCalledWith(
          {...context, tree},
          `${outputPath.split('#')[0]}.yaml`
        );
      });

      it('throws an error if outputPath is not provided.', async () => {
        expect.assertions(2);

        try {
          await exportYaml.execute({}, context, '');
        } catch (error) {
          expect(error).toBeInstanceOf(ExhaustError);
          expect(error).toEqual(new ExhaustError('Output path is required.'));
        }
      });
    });
  });
});
