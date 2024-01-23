from dash import Dash, callback, Input, Output, html, dcc
import numpy as np
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback, activate_mito
import pandas as pd

app = Dash(__name__)
activate_mito(app)

# Create a dataset with 5M rows
df = pd.DataFrame(np.random.randint(0,100,size=(1000000, 4)), columns=list('ABCD'))

app.layout = html.Div([
    html.H1("Stock Analysis"),
    Spreadsheet(df, id={'type': 'spreadsheet', 'id': 'sheet'}),
    html.Div(id='output')
])

if __name__ == '__main__':
    app.run_server(debug=True)