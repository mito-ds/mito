set -e

# Create venv and install requirements
python3 -m venv venv;
source venv/bin/activate;
pip install -r requirements.txt;

# Install necessary node packages
npm install
npx playwright install

# Install mitosheet
cd ../mitosheet

# Install Python dependencies
pip install -e ".[test]"

# Install the npm dependences for Mitosheet, and build JS
npm install
npm run build