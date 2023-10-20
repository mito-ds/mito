from dash import Dash, callback, Input, Output, html, dash_table
from mitosheet.mito_dash.v1 import Spreadsheet, mito_callback

app = Dash(__name__)

CSV_URL = '/Users/marthacryan/gitrepos/mito/mitosheet/datasets/small-datasets/loans.csv'

app.layout = html.Div([
    html.H1("Stock Analysis"),
    Spreadsheet(import_folder='datasets', id='sheet'),
    html.Div(id='output'),
    html.Button('Run', id='rerun-analysis'),
    html.Div(id='output-run-analysis')
])

analysis = None

@mito_callback(
    Output('output', 'children'),
    Input('sheet', 'spreadsheet_result'),
)
def update_code(spreadsheet_result):
    return html.Div([
        html.Code(spreadsheet_result.analysis().fully_parameterized_function),
        html.Code(spreadsheet_result.analysis().get_param_metadata())
    ])

@mito_callback(
    Output('output-run-analysis', 'children'),
    Input('rerun-analysis', 'n_clicks'),
    Input('sheet', 'spreadsheet_result'),
    prevent_initial_call=True
)
def update_output(n_clicks, spreadsheet_result):
    result = spreadsheet_result.analysis().run()
    return html.Div([
        html.H3('Analysis Result'),
        dash_table.DataTable(result.to_dict('records'), [{"name": i, "id": i} for i in result.columns])
    ])
    
if __name__ == '__main__':
    app.run_server(debug=True)