from mitosheet.mito_dash.v1 import Spreadsheet, activate_mito
from dash import Dash, html
import pandas as pd

app = Dash(__name__)
activate_mito(app)

df = pd.read_csv('https://raw.githubusercontent.com/plotly/datasets/master/gapminder2007.csv')

app.layout = html.Div([
    html.H1('Simple Theme Example'),
    Spreadsheet(df, id={'type': 'spreadsheet', 'id': 'sheet'}, theme={'primaryColor': '#f5c107', 'backgroundColor': '#0f0f0f', 'secondaryBackgroundColor': '#515251', 'textColor': '#ffffff'}),
])

if __name__ == '__main__':
    app.run_server(debug=True)