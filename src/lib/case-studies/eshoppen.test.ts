import {describe, expect, jest, test} from '@jest/globals';
import {Eshoppen} from './eshoppen';

jest.setTimeout(30000);

describe('eshoppen:configure test', () => {
  test('initialize and test', async () => {
    const model = await new Eshoppen().configure('eshoppen', {
      type: 'e-cpu',
    });
    expect(model).toBeInstanceOf(Eshoppen);
    await expect(
      model.calculate([
        {
          'n-hours': 1,
          'n-chips': 1,
          tdp: 120,
          'tdp-coeff': 1.02,
        },
      ])
    ).resolves.toStrictEqual([
      {
        'e-cpu': 122.4,
        'n-hours': 1,
        'n-chips': 1,
        tdp: 120,
        'tdp-coeff': 1.02,
      },
    ]);
    await expect(model.calculate([{}])).rejects.toThrowError();
  });
});
