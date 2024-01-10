python3 -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt

npm install
npx playwright install chromium firefox chrome msedge

cd ../mitosheet

pip install -e ".[test]"

npm install
npm run build