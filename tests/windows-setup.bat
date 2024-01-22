@echo off

REM Create and activate virtual environment
python3 -m venv venv
call venv\Scripts\activate.bat

REM Install Python dependencies
pip install -r requirements.txt

REM Install Node.js dependencies and Playwright browsers
npm install
npx playwright install chromium firefox chrome msedge

REM Navigate to the mitosheet directory and install dependencies
cd ../mitosheet
pip install -e ".[test]"

REM Install and build npm packages
npm install
npm run build
