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
cd ../flask_test/react-app
npm install
npm run build
cd ..
python main.py
```