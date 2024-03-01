set -e

# Create venv and install requirements
python3 -m venv venv;
source venv/bin/activate;
pip install -r requirements.txt;

# Install necessary node packages
npm install

# Install playwright. If the user provides a browser, install only that browser
# Otherwise, install all browsers. This is primarily used so that the CI can
# install only the necessary browsers.
if [ $# -eq 0 ]
  then
    npx playwright install chromium webkit firefox chrome
else
    npx playwright install $1
fi

# Install mitosheet
cd ../mitosheet

# Install Python dependencies
pip install -e ".[test]"

# Install the npm dependences for Mitosheet, and build JS
npm install
npm run build