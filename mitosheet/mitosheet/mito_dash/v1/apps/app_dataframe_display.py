from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback, activate_mito
from dash import Dash, html, Input, Output
import pandas as pd

app = Dash(__name__)
activate_mito(app)

df = pd.read_csv('https://raw.githubusercontent.com/plotly/datasets/master/gapminder2007.csv')

app.layout = html.Div([
    html.H1('Simple Dataframe Editing Example'),
    Spreadsheet(df, id={'type': 'spreadsheet', 'id': 'sheet'}),
    html.Div(id='output')
])

@mito_callback(
    Output('output', 'children'),
    Input({'type': 'spreadsheet', 'id': 'sheet'}, 'spreadsheet_result'),
)
def update_output(spreadsheet_result):
    return html.Div([
        html.H3('Edited Dataframes'),
        html.Div(f'Dataframes: {spreadsheet_result.dfs()}')
    ])

if __name__ == '__main__':
    app.run_server(debug=True)