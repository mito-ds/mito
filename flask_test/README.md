# mito-for-flask
An experimental repo figuring out Mito for Flask.

First, setup the venv and install basic dependencies
```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Then, install the mitosheet package
```
cd ../mitosheet
pip install -e "."
mkdir mitosheet/labextension
cp package.json mitosheet/labextension/package.json
touch mitosheet/mito_frontend.css
touch mitosheet/mito_frontend.js
```

Then, setup the React App
```
cd ../flask_test/react-app
npm install
npm run build
```

Finially, run the Flask server, and make sure it works
```
cd ..
python main.py
```

## All the Commands in One

If you want to copy all the commands and run them:
```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../mitosheet
pip install -e "."
mkdir mitosheet/labextension
cp package.json mitosheet/labextension/package.json
touch mitosheet/mito_frontend.css
touch mitosheet/mito_frontend.js
cd ../flask_test/react-app
npm install
npm run build
cd ..
python main.py
```