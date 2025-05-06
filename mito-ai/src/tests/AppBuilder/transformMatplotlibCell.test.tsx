/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { transformMatplotlibCell } from '../../Extensions/AppBuilder/cellConversionUtils';

describe('transformMatplotlibCell', () => {
  test('should transform a cell with plt.show() to use st.pyplot', () => {
    const cellContent = `
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)
plt.plot(x, y)
plt.title('Sine Wave')
plt.show()
`;
    
    const result = transformMatplotlibCell(cellContent).filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'import numpy as np',
      'x = np.linspace(0, 10, 100)',
      'y = np.sin(x)',
      'plt.plot(x, y)',
      'plt.title(\'Sine Wave\')',
      'st.pyplot(plt.gcf())',
    ]);
  });

  test('should transform a cell with multiple plt.show() calls', () => {
    const cellContent = `
import matplotlib.pyplot as plt
import numpy as np

# First plot
plt.figure(1)
x = np.linspace(0, 10, 100)
y = np.sin(x)
plt.plot(x, y)
plt.title('Sine Wave')
plt.show()

# Second plot
plt.figure(2)
x = np.linspace(0, 10, 100)
y = np.cos(x)
plt.plot(x, y)
plt.title('Cosine Wave')
plt.show()
`;
    
    const result = transformMatplotlibCell(cellContent).filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'import numpy as np',
      '# First plot',
      'plt.figure(1)',
      'x = np.linspace(0, 10, 100)',
      'y = np.sin(x)',
      'plt.plot(x, y)',
      'plt.title(\'Sine Wave\')',
      'st.pyplot(plt.gcf())',
      '# Second plot',
      'plt.figure(2)',
      'x = np.linspace(0, 10, 100)',
      'y = np.cos(x)',
      'plt.plot(x, y)',
      'plt.title(\'Cosine Wave\')',
      'st.pyplot(plt.gcf())',
    ]);
  });

  test('should handle a cell with plt.show() and parameters', () => {
    const cellContent = `
import matplotlib.pyplot as plt
plt.plot([1, 2, 3], [4, 5, 6])
plt.show(block=False)
`;
    
    const result = transformMatplotlibCell(cellContent).filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'plt.plot([1, 2, 3], [4, 5, 6])',
      'st.pyplot(plt.gcf())',
    ]);
  });

  test('should handle a cell with no plt.show() call', () => {
    const cellContent = `
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)
plt.plot(x, y)
plt.title('Sine Wave')
# No plt.show() call
`;
    
    const result = transformMatplotlibCell(cellContent).filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'import numpy as np',
      'x = np.linspace(0, 10, 100)',
      'y = np.sin(x)',
      'plt.plot(x, y)',
      'plt.title(\'Sine Wave\')',
      '# No plt.show() call',
    ]);
  });

  test('should handle a cell with no matplotlib imports or usage', () => {
    const cellContent = `
import pandas as pd
import numpy as np

data = {'A': [1, 2, 3], 'B': [4, 5, 6]}
df = pd.DataFrame(data)
print(df)
`;
    
    const result = transformMatplotlibCell(cellContent).filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import pandas as pd',
      'import numpy as np',
      'data = {\'A\': [1, 2, 3], \'B\': [4, 5, 6]}',
      'df = pd.DataFrame(data)',
      'print(df)',
    ]);
  });

  test('should handle empty cell content', () => {
    const cellContent = '';
    
    const result = transformMatplotlibCell(cellContent).filter((line: string) => line !== '');
    
    expect(result.length).toBe(0);
  });

  test('should handle a cell where plt.show is in a comment', () => {
    const cellContent = `
import matplotlib.pyplot as plt
plt.plot([1, 2, 3])
# plt.show() - commented out
`;
    
    const result = transformMatplotlibCell(cellContent).filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'plt.plot([1, 2, 3])',
      '# plt.show() - commented out',
    ]);
  });

  test('should handle a cell with plt.show inside a conditional statement', () => {
    const cellContent = `
import matplotlib.pyplot as plt
plt.plot([1, 2, 3])
if True:
    plt.show()
`;
    
    const result = transformMatplotlibCell(cellContent).filter((line: string) => line !== '');
    
    // The current implementation only replaces lines that *start with* 'plt.show'
    // after being trimmed, so the indented plt.show() WILL be replaced
    // because lines[i]?.trim().startsWith('plt.show') is true for "    plt.show()"
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'plt.plot([1, 2, 3])',
      'if True:',
      'st.pyplot(plt.gcf())',
    ]);
  });
}); 