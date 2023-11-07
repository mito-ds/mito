from mitosheet.mito_dash.v1 import Spreadsheet, activate_mito
from dash import Dash, html
import pandas as pd

app = Dash(__name__)

try:
    Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'})
    assert False
except Exception as e:
    not_activate_mito = e

activate_mito(app)

try:
    Spreadsheet(id='sheet') # type: ignore
    assert False
except Exception as e:
    incorrect_id_error = e


app.layout = html.Div([
    html.H1('Errors were correctly generated!'),
    html.Div("Error for not activated: " + str(not_activate_mito)),
    html.Div("Error for invalid id type: " + str(incorrect_id_error))
])

if __name__ == '__main__':
    app.run_server(debug=True)