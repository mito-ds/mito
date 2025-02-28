import { MagicLine } from '../magicLineUtils';

describe('mito-sql-cell', () => {
  describe('MagicLine', () => {
    it.each([
      ['%%sql', true],
      ['%%sql --section a --close df <<', true],
      ['', false],
      ['%sql', false],
      ['def f():\n    return 22\n%%sql', false]
    ])('%s isSQLCell %s', (text, expected) => {
      expect(
        MagicLine.isSQLCell({ sharedModel: { source: text } } as any)
      ).toEqual(expected);
    });

    it.each([
      ['%%sql', { isSQL: true, output: undefined, args: [], options: {} }],
      [
        '%%sql --section a -x df <<',
        {
          isSQL: true,
          output: 'df',
          args: [],
          options: { '--section': 'a', '--close': undefined }
        }
      ],
      [
        '%%sql -s a df <<',
        { isSQL: true, output: 'df', args: [], options: { '--section': 'a' } }
      ],
      [
        '%%sql -s a df= <<',
        { isSQL: true, output: 'df', args: [], options: { '--section': 'a' } }
      ],
      [
        '%%sql -s a df',
        {
          isSQL: true,
          output: undefined,
          args: ['df'],
          options: { '--section': 'a' }
        }
      ],
      ['%sql', { isSQL: false, output: undefined, args: [], options: {} }],
      ['', { isSQL: false, output: undefined, args: [], options: {} }]
    ])('%s parse to %j', (text, expected) => {
      expect(MagicLine.getSQLMagic({ sharedModel: { source: text } } as any)).toEqual(
        expected
      );
    });

    it.each([
      [
        '',
        {
          isSQL: true,
          output: 'db',
          args: ['line'],
          options: { '--section': 'sqlite1' }
        },
        '%%sql --section sqlite1 line db= <<\n'
      ],
      [
        '%%sql',
        {
          isSQL: true,
          output: 'db',
          args: ['line'],
          options: { '--section': 'sqlite1', '--close': undefined }
        },
        '%%sql --section sqlite1 --close line db= <<'
      ],
      [
        '%%sql --section a df <<',
        {
          isSQL: true,
          output: 'db',
          args: ['line'],
          options: { '--section': 'sqlite1' }
        },
        '%%sql --section sqlite1 line db= <<'
      ],
      [
        '%%sql --section a df <<',
        {
          isSQL: true,
          output: 'db',
          args: ['line'],
          options: { '--file': 'f1' }
        },
        '%%sql --file f1 line db= <<'
      ],
      [
        '%%sql --section a df <<',
        {
          isSQL: true,
          output: undefined,
          args: [],
          options: { '--file': 'f1' }
        },
        '%%sql --file f1'
      ],
      [
        'def f(a, b):\n  return a + b',
        {
          isSQL: true,
          output: 'db',
          args: ['line'],
          options: { '--section': 'sqlite1' }
        },
        '%%sql --section sqlite1 line db= <<\ndef f(a, b):\n  return a + b'
      ]
    ])('%s parse to %j', (text, magic, expected) => {
      const fakeCell = { sharedModel: { source: text } } as any;
      MagicLine.update(fakeCell, magic);
      expect(fakeCell.sharedModel.source).toEqual(expected);
    });
  });
});
