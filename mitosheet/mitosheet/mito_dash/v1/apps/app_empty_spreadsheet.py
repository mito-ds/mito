from mitosheet.mito_dash.v1 import Spreadsheet, activate_mito
from dash import Dash, html
import pandas as pd

app = Dash(__name__)
activate_mito(app)

app.layout = html.Div([
    html.H1('Empty Mito Spreadsheet'),
    Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'}, import_folder='datasets')
])

if __name__ == '__main__':
    app.run_server(debug=True)