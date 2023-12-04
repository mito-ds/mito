from dash import Dash, callback, Input, Output, html, dcc
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback, activate_mito
import pandas as pd

app = Dash(__name__)
activate_mito(app)

app.layout = html.Div([
    html.H1("Data Changer", style={'color': 'white'}),
    dcc.Interval(id='interval1', interval=5 * 1000, n_intervals=0),
    Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'}),
])

@callback(
    Output({'type': 'spreadsheet', 'id': 'sheet'}, 'data'),
    Input('interval1', 'n_intervals')
)
def update_spreadsheet_data(n_intervals):
    print("Refreshing new data")
    # Get new df data here
    df = pd.DataFrame({'First Data': [1, 2, 3], 'Second Data': [4, 5, 6]})
    return df.to_dict('records')

if __name__ == '__main__':
    app.run_server(debug=True)