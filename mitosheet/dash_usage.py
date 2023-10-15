from dash import Dash, callback, Input, Output, html, dcc
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback
import pandas as pd

app = Dash(__name__)

df = pd.DataFrame({'A': [1, 2, 3]})

app.layout = html.Div([
    html.H1("Stock Analysis", style={'color': 'black'}),
    Spreadsheet(df, id='sheet', theme={
        'primaryColor': '#00FF00',
        'backgroundColor': '#111111',
        'secondaryBackgroundColor': '#222222',
        'textColor': '#FFFFFF',
    }),
    html.Div(id='output-code', style={'color': 'black'}),
    html.Div(id='output-selection', style={'color': 'black'}),
])

@mito_callback(
    Output('output-code', 'children'),
    Input('sheet', 'spreadsheet_result'),
)
def update_code(spreadsheet_result):
    print("NEW SPREADSHEET RESULT")
    return html.Div([
        html.Code(spreadsheet_result.code(), style={'color': 'black'})
    ])
    

@mito_callback(
    Output('output-selection', 'children'),
    Input('sheet', 'spreadsheet_selection'),
)
def update_selection(new_selection):
    print("NEW SPREADSHEET SELECTION")
    return html.Div([
        html.Code(str(new_selection), style={'color': 'black'})
    ])
    

if __name__ == '__main__':
    app.run_server(debug=True)
