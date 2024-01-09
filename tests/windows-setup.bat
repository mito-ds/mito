# Create venv and install requirements
python3 -m venv venv;
venv\Scripts\activate;
pip install -r requirements.txt;

# Install necessary node packages
npm install
npx playwright install chromium firefox chrome msedge

# Install mitosheet
cd ../mitosheet

# Install Python dependencies
pip install -e ".[test]"

# Install the npm dependences for Mitosheet, and build JS
npm install
npm run build