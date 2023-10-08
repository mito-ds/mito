from unittest.mock import patch
from dash import Dash, dcc, html, Input, Output, callback, State
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback

app = Dash(__name__)

app.layout = html.Div([
    html.H6("Change the value in the text box to see callbacks in action!"),
    html.Div([
        "Input: ",
        dcc.Input(id='my-input', value='initial value', type='text')
    ]),
    Spreadsheet(id='my-spreadsheet'),
    html.Br(),
    html.Div(id='my-output'),

])





@mito_callback(
    Output(component_id='my-output', component_property='children'),
    Input(component_id='my-spreadsheet', component_property='return_value'),   
    prevent_initial_call=True
)
def update_output_div(result):
    print("HERE!")
    result = result.selection()
    return f'Output: {result}'


if __name__ == '__main__':
    app.run(debug=True)
