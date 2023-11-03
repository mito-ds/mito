from dash import Dash, callback, Input, Output, html, dcc
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback, activate_mito

app = Dash(__name__)
activate_mito(app)

CSV_URL = 'https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv'

app.layout = html.Div([
    html.H1("Stock Analysis"),
    Spreadsheet(CSV_URL, id={'type': 'spreadsheet', 'id': 'sheet'}),
    html.Div(id='output')
])

@mito_callback(
    Output('output', 'children'),
    Input({'type': 'spreadsheet', 'id': 'sheet'}, 'spreadsheet_result'),
)
def update_code(spreadsheet_result):
    return html.Div([
        html.Code(spreadsheet_result.code())
    ])
    
if __name__ == '__main__':
    app.run_server(debug=True)