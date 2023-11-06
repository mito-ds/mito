import pytest
from mitosheet.tests.decorators import requires_dash
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback, activate_mito

@requires_dash
def test_cannot_create_dash_spreadsheet_component_outside_dash():
    with pytest.raises(Exception):
        Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'})
    
@requires_dash
def test_cannot_create_dash_spreadsheet_component_without_activating():
    from dash import Input, Output, State, Dash, html, dcc
    app = Dash(__name__)

    with pytest.raises(Exception):
        Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'})
    


@requires_dash
def test_mito_callback_component_callable_with_no_mito():
    from dash import Input, Output, State, Dash, html, dcc

    assert callable(mito_callback)

    # Make a dash app
    app = Dash(__name__)
    activate_mito(app)

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
    activate_mito(app)

    app.layout = html.Div([
        dcc.Input(id='input', value='initial value'),
        html.Div(id='output'),
        dcc.Store(id='state'),
        Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'})
    ])
    
    @mito_callback(
        Output('output', 'value'),
        Input('input', 'value'),
        Input({'type': 'spreadsheet', 'id': 'sheet'}, 'mito_spreadsheet_result'),
        State('state', 'value'),
    )
    def func(input_value, spreadsheet_data, state_value):
        return input_value
    

@requires_dash
def test_mito_callback_component_callable_with_spreadsheet_in_state():
    from dash import Input, Output, State, Dash, html, dcc

    # Make a dash app
    app = Dash(__name__)
    activate_mito(app)

    app.layout = html.Div([
        dcc.Input(id='input', value='initial value'),
        html.Div(id='output'),
        dcc.Store(id='state'),
        Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'})
    ])
    
    @mito_callback(
        Output('output', 'value'),
        Input('input', 'value'),
        State({'type': 'spreadsheet', 'id': 'sheet'}, 'mito_spreadsheet_result'),
        State('state', 'value'),
    )
    def func(input_value, spreadsheet_data, state_value):
            return input_value
    
@requires_dash
def test_can_pass_track_selection():
    from dash import Input, Output, State, Dash, html, dcc

     # Make a dash app
    app = Dash(__name__)
    activate_mito(app)

    app.layout = html.Div([
        Spreadsheet(id={'type': 'spreadsheet', 'id': 'sheet'}, track_selection=False)
    ])