from dash import Dash, html, dcc, Output, Input
from dash.exceptions import PreventUpdate
import plotly.express as px
import pandas as pd

from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback, activate_mito

df = pd.read_csv('https://raw.githubusercontent.com/plotly/datasets/master/gapminder_unfiltered.csv')

app = Dash(__name__)
activate_mito(app)

app.layout = html.Div([
    Spreadsheet(df, id={'type': 'spreadsheet', 'id': 'sheet'}, track_selection=True),
    dcc.Graph(id='graph-content'),
])

@mito_callback(
    Output('graph-content', 'figure'),
    Input({'type': 'spreadsheet', 'id': 'sheet'}, 'spreadsheet_selection')
)
def update_code(spreadsheet_selection):
    if spreadsheet_selection is None:
        raise PreventUpdate

    # Get selected rows from the original dataframe
    index = spreadsheet_selection.index
    dff = df.loc[index]

    return px.line(dff, x='year', y='lifeExp', color='continent')

if __name__ == '__main__':
    app.run(debug=True)