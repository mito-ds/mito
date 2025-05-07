/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { removeInvalidLines } from '../../Extensions/AppBuilder/cellConversionUtils';

describe('removeInvalidLines', () => {
    test('should remove lines starting with !', () => {
        const cellContent = 'import pandas as pd\n!pip install numpy\ndf = pd.DataFrame()';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('import pandas as pd\ndf = pd.DataFrame()');
    });

    test('should remove lines starting with %', () => {
        const cellContent = 'import pandas as pd\n%matplotlib inline\ndf = pd.DataFrame()';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('import pandas as pd\ndf = pd.DataFrame()');
    });

    test('should remove lines starting with %%', () => {
        const cellContent = '%%time\nfor i in range(1000):\n    print(i)';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('for i in range(1000):\n    print(i)');
    });

    test('should handle multiple invalid lines', () => {
        const cellContent = '!pip install pandas\n%matplotlib inline\n%%time\nimport pandas as pd';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('import pandas as pd');
    });

    test('should handle empty lines around invalid lines', () => {
        const cellContent = 'import numpy as np\n\n!pip install pandas\n\nimport pandas as pd';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('import numpy as np\n\n\nimport pandas as pd');
    });

    test('should handle lines with indentation before magic commands', () => {
        const cellContent = 'if True:\n    %matplotlib inline\n    plt.plot(data)';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('if True:\n    plt.plot(data)');
    });

    test('should not remove lines that have % or ! in the middle', () => {
        const cellContent = 'text = "This has a % symbol"\nurl = "https://example.com/!important"';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('text = "This has a % symbol"\nurl = "https://example.com/!important"');
    });

    test('should handle empty input', () => {
        const cellContent = '';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('');
    });

    test('should handle input with only invalid lines', () => {
        const cellContent = '!pip install pandas\n%matplotlib inline\n%%time';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('');
    });

    test('should not remove valid lines', () => {
        const cellContent = 'import pandas as pd\nplt.plot(data)';
        const result = removeInvalidLines(cellContent);

        expect(result).toBe('import pandas as pd\nplt.plot(data)');
    });
});
