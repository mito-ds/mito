/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { transformVisualizationCell } from '../../Extensions/AppBuilder/visualizationConversionUtils';

describe('transformVisualizationCell', () => {
  test('should transform basic Matplotlib with plt.show()', () => {
    const cellContent = `
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)
plt.plot(x, y)
plt.title('Sine Wave')
plt.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'import numpy as np',
      'x = np.linspace(0, 10, 100)',
      'y = np.sin(x)',
      'plt.plot(x, y)',
      'plt.title(\'Sine Wave\')',
      'display_viz(plt.gcf())',
    ]);
  });

  test('should transform Matplotlib with figure variable', () => {
    const cellContent = `
import matplotlib.pyplot as plt
fig = plt.figure(figsize=(10, 5))
plt.plot([1, 2, 3], [4, 5, 6])
plt.title('Figure Variable Test')
plt.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'fig = plt.figure(figsize=(10, 5))',
      'plt.plot([1, 2, 3], [4, 5, 6])',
      'plt.title(\'Figure Variable Test\')',
      'display_viz(plt.gcf())',
    ]);
  });

  test('should transform Matplotlib subplots', () => {
    const cellContent = `
import matplotlib.pyplot as plt
fig, ax = plt.subplots(figsize=(12, 6))
ax.plot([1, 2, 3], [4, 5, 6], 'g-')
ax.set_title('Subplots Pattern')
plt.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'fig, ax = plt.subplots(figsize=(12, 6))',
      'ax.plot([1, 2, 3], [4, 5, 6], \'g-\')',
      'ax.set_title(\'Subplots Pattern\')',
      'display_viz(plt.gcf())',
    ]);
  });

  test('should transform Plotly Express figure', () => {
    const cellContent = `
import plotly.express as px
import pandas as pd

df = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
fig = px.line(df, x='x', y='y', title='Plotly Test')
fig.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import plotly.express as px',
      'import pandas as pd',
      'df = pd.DataFrame({\'x\': [1, 2, 3], \'y\': [4, 5, 6]})',
      'fig = px.line(df, x=\'x\', y=\'y\', title=\'Plotly Test\')',
      'display_viz(fig)',
    ]);
  });

  test('should transform Plotly Graph Objects', () => {
    const cellContent = `
import plotly.graph_objects as go

fig = go.Figure()
fig.add_trace(go.Scatter(x=[1, 2, 3], y=[4, 5, 6], mode='lines+markers'))
fig.update_layout(title='Plotly GO Example')
fig.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import plotly.graph_objects as go',
      'fig = go.Figure()',
      'fig.add_trace(go.Scatter(x=[1, 2, 3], y=[4, 5, 6], mode=\'lines+markers\'))',
      'fig.update_layout(title=\'Plotly GO Example\')',
      'display_viz(fig)',
    ]);
  });

  test('should transform Plotly with make_subplots', () => {
    const cellContent = `
from plotly.subplots import make_subplots
import plotly.graph_objects as go

subfig = make_subplots(rows=1, cols=2)
subfig.add_trace(go.Scatter(x=[1, 2, 3], y=[4, 5, 6]), row=1, col=1)
subfig.add_trace(go.Scatter(x=[1, 2, 3], y=[6, 5, 4]), row=1, col=2)
subfig.update_layout(title='Subplots Example')
subfig.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'from plotly.subplots import make_subplots',
      'import plotly.graph_objects as go',
      'subfig = make_subplots(rows=1, cols=2)',
      'subfig.add_trace(go.Scatter(x=[1, 2, 3], y=[4, 5, 6]), row=1, col=1)',
      'subfig.add_trace(go.Scatter(x=[1, 2, 3], y=[6, 5, 4]), row=1, col=2)',
      'subfig.update_layout(title=\'Subplots Example\')',
      'display_viz(subfig)',
    ]);
  });

  test('should transform Plotly figure factory', () => {
    const cellContent = `
import plotly.figure_factory as ff
import numpy as np

x = np.random.randn(1000)
hist_data = [x]
group_labels = ['distplot']
fig_ff = ff.create_distplot(hist_data, group_labels)
fig_ff.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import plotly.figure_factory as ff',
      'import numpy as np',
      'x = np.random.randn(1000)',
      'hist_data = [x]',
      'group_labels = [\'distplot\']',
      'fig_ff = ff.create_distplot(hist_data, group_labels)',
      'display_viz(fig_ff)',
    ]);
  });

  test('should handle multiple visualizations in one cell', () => {
    const cellContent = `
import matplotlib.pyplot as plt

# First plot
fig1 = plt.figure(figsize=(8, 4))
plt.plot([1, 2, 3], [4, 5, 6], 'b-')
plt.title('First plot')
plt.show()

# Second plot
fig2 = plt.figure(figsize=(8, 4))
plt.scatter([1, 2, 3], [6, 5, 4], c='red')
plt.title('Second plot')
plt.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      '# First plot',
      'fig1 = plt.figure(figsize=(8, 4))',
      'plt.plot([1, 2, 3], [4, 5, 6], \'b-\')',
      'plt.title(\'First plot\')',
      'display_viz(plt.gcf())',
      '# Second plot',
      'fig2 = plt.figure(figsize=(8, 4))',
      'plt.scatter([1, 2, 3], [6, 5, 4], c=\'red\')',
      'plt.title(\'Second plot\')',
      'display_viz(plt.gcf())',
    ]);
  });

  test('should handle cells with no visualizations', () => {
    const cellContent = `
import pandas as pd
import numpy as np

data = {'A': [1, 2, 3], 'B': [4, 5, 6]}
df = pd.DataFrame(data)
print(df)
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import pandas as pd',
      'import numpy as np',
      'data = {\'A\': [1, 2, 3], \'B\': [4, 5, 6]}',
      'df = pd.DataFrame(data)',
      'print(df)',
    ]);
  });

  test('should handle complex multi-line assignments with visualizations', () => {
    const cellContent = `
import matplotlib.pyplot as plt

fig = (
    plt.figure(
        figsize=(10, 6)
    )
)
plt.plot([1, 2, 3], [4, 5, 6])
plt.title('Multi-line assignment')
plt.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'fig = (',
      '    plt.figure(',
      '        figsize=(10, 6)',
      '    )',
      ')',
      'plt.plot([1, 2, 3], [4, 5, 6])',
      'plt.title(\'Multi-line assignment\')',
      'display_viz(plt.gcf())',
    ]);
  });

  test.skip('should handle visualizations with alternative import patterns', () => {
    const cellContent = `
import matplotlib.pyplot as pyplot

pyplot.figure(figsize=(8, 4))
pyplot.plot([1, 2, 3], [4, 5, 6])
pyplot.title('Alternative import pattern')
pyplot.show()
`;
    
    // Note: Currently the function would not detect this because it's hardcoded to 'plt'
    // This test shows the current behavior, which is a limitation
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as pyplot',
      'pyplot.figure(figsize=(8, 4))',
      'pyplot.plot([1, 2, 3], [4, 5, 6])',
      'pyplot.title(\'Alternative import pattern\')',
      'pyplot.show()',
    ]);
  });

  test('should handle Plotly with chained methods', () => {
    const cellContent = `
import plotly.express as px
import pandas as pd

df = pd.DataFrame({'x': [1, 2, 3], 'y': [4, 5, 6]})
fig = (px.line(df, x='x', y='y')
       .update_traces(mode='markers+lines')
       .update_layout(title='Chained Methods Plot'))
fig.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import plotly.express as px',
      'import pandas as pd',
      'df = pd.DataFrame({\'x\': [1, 2, 3], \'y\': [4, 5, 6]})',
      'fig = (px.line(df, x=\'x\', y=\'y\')',
      '       .update_traces(mode=\'markers+lines\')',
      '       .update_layout(title=\'Chained Methods Plot\'))',
      'display_viz(fig)',
    ]);
  });

  test('should handle visualizations in functions', () => {
    const cellContent = `
import matplotlib.pyplot as plt

def create_plot(data):
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.plot(data, 'g-o')
    ax.set_title('Plot from Function')
    return fig

# This should be detected
result_fig = create_plot([1, 2, 3, 4])
result_fig.show()
`;
    
    const result = transformVisualizationCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import matplotlib.pyplot as plt',
      'def create_plot(data):',
      '    fig, ax = plt.subplots(figsize=(10, 5))',
      '    ax.plot(data, \'g-o\')',
      '    ax.set_title(\'Plot from Function\')',
      '    return fig',
      '# This should be detected',
      'result_fig = create_plot([1, 2, 3, 4])',
      'display_viz(result_fig)',
    ]);
  });
});