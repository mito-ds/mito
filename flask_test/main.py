from flask import Flask, request, send_from_directory

from mitosheet.mito_flask.v1 import process_mito_event

app = Flask(__name__, static_folder='./react-app/dist')

@app.route('/')
def index():
    return send_from_directory('./react-app/', 'index.html')

@app.route('/api/mito/process', methods=['POST'])
def process_mito_event_api():
    # Extract 'spreadsheet_contents' and 'mito_event' from the request
    data = request.json
    backend_state = data.get('backend_state')
    mito_event = data.get('mito_event')

    # Process the event, and return the new results
    return process_mito_event(backend_state, mito_event)

if __name__ == '__main__':
    app.run()