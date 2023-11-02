from dash import Dash, callback, Input, Output, html, dcc
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback, activate_mito
import pandas as pd

app = Dash(__name__)
activate_mito(app)

app.layout = html.Div([
    html.H1("Stock Analysis", style={'color': 'white'}),
    # A dropdown for selecting between two dataframes
    dcc.Dropdown(
        id='dropdown',
        options=[
            {'label': 'Stock Data', 'value': 'stock_data'},
            {'label': 'Stock Data 2', 'value': 'stock_data_2'},
        ],
        value='stock_data'
    ),
    Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'}),
])

@callback(
    Output({'type': 'spreadsheet', 'id': 'sheet'}, 'data'),
    Input('dropdown', 'value')
)
def update_spreadsheet_data(dropdown_value):
    if dropdown_value == 'stock_data':
        df = pd.DataFrame({'First Data': [1, 2, 3], 'Second Data': [4, 5, 6]})
    else:
        df = pd.DataFrame({'First Data': [7, 8, 9], 'Second Data': [10, 11, 12]})

    return df.to_dict('records')

if __name__ == '__main__':
    app.run_server(debug=True)