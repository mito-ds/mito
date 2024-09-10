@echo off

REM Create and activate virtual environment
python3 -m venv venv
call venv\Scripts\activate.bat

REM Install Python dependencies
pip install -r requirements.txt

REM Install Node.js dependencies and Playwright browsers
jlpm install

REM Install playwright. If the user provides a browser, install only that browser
REM Otherwise, install all browsers. This is primarily used so that the CI can
REM install only the necessary browsers.
if [%1]==[] npx playwright install chromium firefox chrome msedge else npx playwright install %1


REM Navigate to the mitosheet directory and install dependencies
cd ../mitosheet
pip install -e ".[test]"

REM Install and build npm packages
jlpm install
jlpm run build
