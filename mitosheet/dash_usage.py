
from mitosheet.mito_dash.v1 import Spreadsheet, spreadsheet_callback
from dash import Dash, html, Output

import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3]})

app = Dash(__name__)

app.layout = html.Div([
    Spreadsheet(df, id='mito-dash-wrapper-1'),
    html.Div(id='output1'),
    Spreadsheet(df, id='mito-dash-wrapper-2'),
    html.Div(id='output2'),
])

@spreadsheet_callback(
    Output('output1', 'children'),
    input_id='mito-dash-wrapper-1',
)
def update_output(spreadsheet_result):
    dfs = spreadsheet_result.dfs()
    return f'Output: {str(dfs)}'

@spreadsheet_callback(
    Output('output2', 'children'),
    input_id='mito-dash-wrapper-2',
)
def update_output(spreadsheet_result):
    dfs = spreadsheet_result.dfs()
    return f'Output: {str(dfs)}'


if __name__ == '__main__':
    app.run_server(debug=True)
