
from mitosheet.mito_dash.v1 import Spreadsheet, spreadsheet_callback
from dash import Dash, html, Output, dash_table, html, callback, Input

import pandas as pd

df = pd.DataFrame({'A': [1, 2, 3]})

app = Dash(__name__)

app.layout = html.Div([
    Spreadsheet(df, id='mito-dash-wrapper'),
    dash_table.DataTable(df.to_dict('records'), id='output'),
    html.Button('New Mito Data', id='new-mito-data')
])

@spreadsheet_callback(
    Output('output', 'data'),
    input_id='mito-dash-wrapper',
)
def update_output(spreadsheet_result):
    dfs = spreadsheet_result.dfs()
    return dfs[0].to_dict('records')


@callback(Output('mito-dash-wrapper', 'data'), Input('new-mito-data', 'n_clicks'), prevent_initial_call=True)
def reset_data(n_clicks):
    new_df = pd.DataFrame({'A': [i for i in range(n_clicks)]})
    return new_df.to_json(orient='records')


if __name__ == '__main__':
    app.run_server(debug=True)
