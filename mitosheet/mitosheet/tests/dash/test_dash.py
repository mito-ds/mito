import pytest
from mitosheet.tests.decorators import requires_dash
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback

@requires_dash
def test_can_create_dash_spreadsheet_component():
    s = Spreadsheet(id='an id')
    assert s is not None


@requires_dash
def test_mito_callback_component_callable_with_no_mito():
    from dash import Input, Output, State, Dash, html, dcc

    assert callable(mito_callback)

    # Make a dash app
    app = Dash(__name__)

    app.layout = html.Div([
        dcc.Input(id='input', value='initial value'),
        html.Div(id='output'),
        dcc.Store(id='state'),
    ])
    
    @mito_callback(
        Output('output', 'value'),
        Input('input', 'value'),
        State('state', 'value'),
    )
    def func(input_value, state_value):
        return input_value

@requires_dash
def test_mito_callback_component_callable_with_spreadsheet_as_input():
    from dash import Input, Output, State, Dash, html, dcc

    # Make a dash app
    app = Dash(__name__)

    app.layout = html.Div([
        dcc.Input(id='input', value='initial value'),
        html.Div(id='output'),
        dcc.Store(id='state'),
        Spreadsheet(id='spreadsheet')
    ])
    
    @mito_callback(
        Output('output', 'value'),
        Input('input', 'value'),
        Input('spreadsheet', 'mito_spreadsheet_result'),
        State('state', 'value'),
    )
    def func(input_value, spreadsheet_data, state_value):
        return input_value
    

@requires_dash
def test_mito_callback_component_callable_with_spreadsheet_in_state():
    from dash import Input, Output, State, Dash, html, dcc

    # Make a dash app
    app = Dash(__name__)

    app.layout = html.Div([
        dcc.Input(id='input', value='initial value'),
        html.Div(id='output'),
        dcc.Store(id='state'),
        Spreadsheet(id='spreadsheet')
    ])
    
    @mito_callback(
        Output('output', 'value'),
        Input('input', 'value'),
        State('spreadsheet', 'mito_spreadsheet_result'),
        State('state', 'value'),
    )
    def func(input_value, spreadsheet_data, state_value):
            return input_value
    
@requires_dash
def test_can_pass_track_selection():
    from dash import Input, Output, State, Dash, html, dcc

     # Make a dash app
    app = Dash(__name__)

    app.layout = html.Div([
        Spreadsheet(id='spreadsheet', track_selection=False)
    ])