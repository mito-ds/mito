
# Create venv and install requirements
python3 -m venv venv;
source venv/bin/activate;
pip install -r requirements.txt;

# Install necessary node packages
npm install

# Install mitosheet
cd ../mitosheet

# Install Python dependencies
pip install -e ".[test, deploy]"

# Install the npm dependences
npm install

# Setup JupyterLab development
jupyter labextension develop . --overwrite

# Setup Jupyter Notebook development
jupyter nbextension uninstall mitosheet # NOTE: not sure why this first is needed. Somehow, it gets installed in the setup.py...
jupyter nbextension install --py --symlink --sys-prefix mitosheet
jupyter nbextension enable --py --sys-prefix mitosheet   

