/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { MagicLine } from '../magicLineUtils';

describe('mito-sql-cell', () => {
  describe('MagicLine', () => {
    it.each([
      ['%%sql', true],
      ['%%sql --out df a', true],
      ['', false],
      ['%sql', false],
      ['def f():\n    return 22\n%%sql', false]
    ])('%s isSQLCell %s', (text, expected) => {
      expect(
        MagicLine.isSQLCell({ sharedModel: { source: text } } as any)
      ).toEqual(expected);
    });

    it.each([
      [
        '%%sql',
        {
          isSQL: true,
          output: undefined,
          connectionName: '',
          configurationFile: undefined
        }
      ],
      [
        '%%sql -o df a',
        {
          isSQL: true,
          output: 'df',
          connectionName: 'a',
          configurationFile: undefined
        }
      ],
      [
        '%%sql --out df a',
        {
          isSQL: true,
          output: 'df',
          connectionName: 'a',
          configurationFile: undefined
        }
      ],
      [
        '%%sql -c f.ini -o df a',
        {
          isSQL: true,
          output: 'df',
          connectionName: 'a',
          configurationFile: 'f.ini'
        }
      ],
      [
        '%%sql --configfile f.ini -o df a',
        {
          isSQL: true,
          output: 'df',
          connectionName: 'a',
          configurationFile: 'f.ini'
        }
      ],
      [
        '%sql',
        {
          isSQL: false,
          output: undefined,
          connectionName: '',
          configurationFile: undefined
        }
      ],
      [
        '',
        {
          isSQL: false,
          output: undefined,
          connectionName: '',
          configurationFile: undefined
        }
      ]
    ])('%s parse to %j', (text, expected) => {
      expect(
        MagicLine.getSQLMagic({ sharedModel: { source: text } } as any)
      ).toEqual(expected);
    });

    it.each([
      [
        '',
        {
          isSQL: true,
          output: 'db',
          connectionName: 'sqlite1',
        },
        '%%sql --out db sqlite1\n'
      ],
      [
        '%%sql',
        {
          isSQL: true,
          output: 'db',
          connectionName: 'sqlite1',
        },
        '%%sql --out db sqlite1'
      ],
      [
        '%%sql --section a',
        {
          isSQL: true,
          output: 'db',
          connectionName: 'sqlite1',
        },
        '%%sql --out db sqlite1'
      ],
      [
        '%%sql --section a df <<',
        {
          isSQL: true,
          output: 'db',
          connectionName: 'sqlite1',
          configurationFile: 'f1'
        },
        '%%sql --configfile "f1" --out db sqlite1'
      ],
      [
        'def f(a, b):\n  return a + b',
        {
          isSQL: true,
          output: 'db',
          connectionName: 'sqlite1',
          configurationFile: 'f1'
        },
        '%%sql --configfile "f1" --out db sqlite1\ndef f(a, b):\n  return a + b'
      ]
    ])('%s with magic %s update to %j', (text, magic, expected) => {
      const fakeCell = { sharedModel: { source: text } } as any;
      MagicLine.update(fakeCell, magic);
      expect(fakeCell.sharedModel.source).toEqual(expected);
    });
  });
});
