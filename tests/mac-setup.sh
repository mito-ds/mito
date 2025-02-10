set -e

# Create venv and install requirements
python3 -m venv venv;
source venv/bin/activate;
pip install -r requirements.txt;

# Install necessary node packages
jlpm install

# Install playwright. If the user provides a browser, install only that browser
# Otherwise, install all browsers. This is primarily used so that the CI can
# install only the necessary browsers.
if [ $# -eq 0 ]
  then
    npx playwright install chromium webkit firefox || echo "Warning: Failed to install some browsers"
    npx playwright install chrome || echo "Warning: Failed to install Chrome"
  else
    npx playwright install $1 || echo "Warning: Failed to install specified browser"
    npx playwright install || echo "Warning: Failed to install additional browsers"
fi


# Install mitosheet and build JS
cd ../mitosheet
pip install -e ".[test]"
jlpm install
jlpm run build

# Install mito-ai and build JS
cd ../mito-ai
pip install -e ".[test]"
jlpm install
jlpm run build

# Install mito-sql-cell and build JS
cd ../mito-sql-cell
pip install -e ".[test]"
jlpm install
jlpm run build
