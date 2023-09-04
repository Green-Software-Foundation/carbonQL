import {describe, expect, jest, test} from '@jest/globals';
import {ShellModel} from './index';

jest.setTimeout(30000);

describe('ccf:configure test', () => {
  test('initialize with params', async () => {
    const impactModel = new ShellModel();
    await impactModel.configure('test', {
      provider: 'aws',
      instance_type: 't2.micro',
      executable: 'sampler',
    });
    await expect(
      impactModel.calculate([
        {duration: 3600, cpu: 0.5, datetime: '2021-01-01T00:00:00Z'},
      ])
    ).resolves.toStrictEqual([
      {duration: 3600, cpu: 0.5, datetime: '2021-01-01T00:00:00Z', e: 1},
    ]);
  });
});
