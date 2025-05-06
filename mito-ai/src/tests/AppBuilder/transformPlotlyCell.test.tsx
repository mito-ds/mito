/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { transformPlotlyCell, extractPlotlyFigVariableNames } from '../../Extensions/AppBuilder/cellConversionUtils';

describe('transformPlotlyCell', () => {
  test('should transform a cell with Plotly figure and show() call', () => {
    const cellContent = `
import plotly.express as px
fig = px.scatter(x=[1, 2, 3], y=[4, 5, 6])
fig.show()
`;
    
    const result = transformPlotlyCell(cellContent).split('\n').filter((line: string) => line !== '');

    expect(result).toEqual([
      'import plotly.express as px',
      'fig = px.scatter(x=[1, 2, 3], y=[4, 5, 6])',
      'st.plotly_chart(fig)',
    ]);
  });

  test('should transform a cell with multiple Plotly figures and show() calls', () => {
    const cellContent = `
import plotly.express as px
import plotly.graph_objects as go

fig1 = px.scatter(x=[1, 2, 3], y=[4, 5, 6])
fig1.show()

fig2 = go.Figure()
fig2.add_trace(go.Scatter(x=[1, 2, 3], y=[1, 3, 2]))
fig2.show()
`;
    
    const result = transformPlotlyCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import plotly.express as px',
      'import plotly.graph_objects as go',
      'fig1 = px.scatter(x=[1, 2, 3], y=[4, 5, 6])',
      'st.plotly_chart(fig1)',
      'fig2 = go.Figure()',
      'fig2.add_trace(go.Scatter(x=[1, 2, 3], y=[1, 3, 2]))',
      'st.plotly_chart(fig2)'
    ]);
  });

  test('should transform a cell with Plotly figure but no show() call', () => {
    const cellContent = `
import plotly.express as px
fig = px.scatter(x=[1, 2, 3], y=[4, 5, 6])
# No fig.show() call
`;
    
    const result = transformPlotlyCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import plotly.express as px',
      'fig = px.scatter(x=[1, 2, 3], y=[4, 5, 6])',
      '# No fig.show() call',
    ]);
  });

  test('should handle a cell with no Plotly figures', () => {
    const cellContent = `
import pandas as pd
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
print(df)
`;
    
    const result = transformPlotlyCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import pandas as pd',
      'df = pd.DataFrame({\'A\': [1, 2, 3], \'B\': [4, 5, 6]})',
      'print(df)',
    ]);
  });

  test('should handle empty cell content', () => {
    const cellContent = '';
    
    const result = transformPlotlyCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result.length).toBe(0);
  });

  test('should handle a cell with more complex Plotly usage', () => {
    const cellContent = `
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Create figure with subplots
figure = make_subplots(rows=1, cols=2)

# Add traces
figure.add_trace(
    go.Scatter(x=[1, 2, 3], y=[4, 5, 6]),
    row=1, col=1
)
figure.add_trace(
    go.Bar(x=[1, 2, 3], y=[2, 3, 1]),
    row=1, col=2
)

figure.update_layout(title_text="Side By Side Plots")
figure.show()
`;
    
    const result = transformPlotlyCell(cellContent).split('\n').filter((line: string) => line !== '');
    
    expect(result).toEqual([
      'import plotly.graph_objects as go',
      'from plotly.subplots import make_subplots',
      '# Create figure with subplots',
      'figure = make_subplots(rows=1, cols=2)',
      '# Add traces',
      'figure.add_trace(',
      '    go.Scatter(x=[1, 2, 3], y=[4, 5, 6]),',
      '    row=1, col=1',
      ')',
      'figure.add_trace(',
      '    go.Bar(x=[1, 2, 3], y=[2, 3, 1]),',
      '    row=1, col=2',
      ')',
      'figure.update_layout(title_text="Side By Side Plots")',
      'st.plotly_chart(figure)',
    ]);
  });
});

describe('extractPlotlyFigVariableNames', () => {
  test('should extract figure variable names from px assignments', () => {
    const cellContent = `
import plotly.express as px
fig1 = px.scatter(x=[1, 2, 3], y=[4, 5, 6])
fig2 = px.line(x=[1, 2, 3], y=[1, 3, 2])
`;
    
    const result = extractPlotlyFigVariableNames(cellContent).filter((line: string) => line !== '');
    
    expect(result).toContain('fig1');
    expect(result).toContain('fig2');
    expect(result.length).toBe(2);
  });

  test('should extract figure variable names from go.Figure assignments', () => {
    const cellContent = `
import plotly.graph_objects as go
fig = go.Figure()
fig.add_trace(go.Scatter(x=[1, 2, 3], y=[1, 3, 2]))
`;
    
    const result = extractPlotlyFigVariableNames(cellContent).filter((line: string) => line !== '');
    
    expect(result).toContain('fig');
    expect(result.length).toBe(1);
  });

  test('should extract figure variable names from show() calls', () => {
    const cellContent = `
import plotly.express as px
my_custom_fig = px.scatter(x=[1, 2, 3], y=[4, 5, 6])
my_custom_fig.show()
`;
    
    const result = extractPlotlyFigVariableNames(cellContent).filter((line: string) => line !== '');
    
    expect(result).toContain('my_custom_fig');
    expect(result.length).toBe(1);
  });

  test('should not extract Python keywords as variable names', () => {
    const cellContent = `
import plotly.express as px
if = px.scatter(x=[1, 2, 3], y=[4, 5, 6])  # invalid Python, but testing our extraction
for = px.line(x=[1, 2, 3], y=[1, 3, 2])     # invalid Python, but testing our extraction
`;
    
    const result = extractPlotlyFigVariableNames(cellContent).filter((line: string) => line !== '');
    
    expect(result).not.toContain('if');
    expect(result).not.toContain('for');
    expect(result.length).toBe(0);
  });

  test('should handle empty cell content', () => {
    const cellContent = '';
    
    const result = extractPlotlyFigVariableNames(cellContent).filter((line: string) => line !== '');
    
    expect(result.length).toBe(0);
  });
}); 