
from mitosheet.mito_dash.v1 import Spreadsheet, spreadsheet_callback
from dash import Dash, html, Output, dash_table

import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3]})

app = Dash(__name__)

app.layout = html.Div([
    Spreadsheet(df, id='mito-dash-wrapper'),
    dash_table.DataTable(df.to_dict('records'), id='output')
])

@spreadsheet_callback(
    Output('output', 'data'),
    input_id='mito-dash-wrapper',
)
def update_output(spreadsheet_result):
    dfs = spreadsheet_result.dfs()
    return dfs[0].to_dict('records')


if __name__ == '__main__':
    app.run_server(debug=True)
