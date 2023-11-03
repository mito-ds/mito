from dash import Dash, html, Input, Output, Patch, callback
from mitosheet.mito_dash.v1 import Spreadsheet, activate_mito

app = Dash(__name__)
activate_mito(app)

app.layout = html.Div([
    html.Button("Add Spreadsheet", id="dynamic-add-spreadsheet-btn", n_clicks=0),
    html.Div(id='dynamic-spreadsheet-container-div', children=[]),
])

@callback(
    Output('dynamic-spreadsheet-container-div', 'children'),
    Input('dynamic-add-spreadsheet-btn', 'n_clicks')
)
def display_dropdowns(n_clicks):
    patched_children = Patch()

    new_element = html.Div([
        Spreadsheet(
            id={
                'type': 'spreadsheet',
                'id': str(n_clicks)
            },
            import_folder='datasets'
        ),
    ])
    patched_children.append(new_element)
    return patched_children


if __name__ == '__main__':
    app.run(debug=True)