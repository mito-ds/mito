"""
The switch.py package is responsible for switching the enviornment
between mitosheet, mitosheet2, and mitosheet3. Usage is:
```
python switch.py [mitosheet | mitosheet2 | mitosheet3]
```

We save the entire package.json files in a string so that it is easy to
know what to modify if you want to change the package.json. 

NOTE: instead of editing the package.json directly, you should edit these
string versions of the file.

The main things that change:
1.  Versions of packages (JupyterLab specific ones, an react, react-dom
    because JLab 2.0 has specific versions it needs).
2.  Changing the commands to be right to the specific version of JLab.

There are also some other misc. cleaning operations that occcur, like
removing files that are no longer needed after the switch.

Notably, all changes occur within the package.json, which serve as the 
single point of truth for which package we are currently working with.
"""
import shutil
import json
import sys
import os

MITOSHEET_TWO_PACKAGE_JSON = """{
  "files": [
    "lib/**/*.js",
    "fonts/**/*",
    "dist/*.js",
    "css/**/*.css",
    "style/index.js"
  ],
  "jupyterlab": {
    "outputDir": "mitosheet/labextension",
    "extension": "lib/plugin"
  },
  "name": "mitosheet2",
  "license": "AGPL-3.0-only",
  "author": {
    "name": "Mito Sheet",
    "email": "naterush1997@gmail.com"
  },
  "bugs": {
    "url": "https://github.com/mito-ds/monorepo/issues"
  },
  "repository": {
    "url": "https://github.com/mito-ds/monorepo",
    "type": "git"
  },
  "version": "0.1.341",
  "dependencies": {
    "@jupyter-widgets/base": "^1.1.10 || ^2 || ^3",
    "@jupyterlab/notebook": "^2.2.5",
    "@types/fscreen": "^1.0.1",
    "@types/jest": "^27.0.2",
    "@types/react-dom": "^17.0.9",
    "fscreen": "^1.1.0",
    "react": "~16.9.0",
    "react-dom": "~16.9.0",
    "ts-jest": "^27.0.5"
  },
  "scripts": {
    "clean:lib": "rimraf lib tsconfig.tsbuildinfo",
    "clean:labextension": "rimraf mitosheet/labextension",
    "clean:all": "jlpm run clean:lib && jlpm run clean:labextension",
    "clean": "npm run clean:all",

    "build:labextension:dev": "npm run clean:labextension && npm run build:lib && mkdirp mitosheet/labextension && cd mitosheet/labextension && npm pack ../..",
    "build:all:dev": "npm run build:labextension:dev",
    "build:dev": "npm run build:all:dev",
    
    "build:lib": "tsc",
    "build:labextension": "npm run clean:labextension && mkdirp mitosheet/labextension && cd mitosheet/labextension && npm pack ../..",
    "build:all": "npm run build:lib && npm run build:labextension",
    "build": "npm run build:all",

    "watch:lib": "tsc -w",
    "watch:labextension": "jupyter labextension watch .",
    "watch:all": "run-p watch:lib watch:labextension",
    "watch": "npm run watch:all",

    "lint:check": "eslint src/ --ext .ts,.tsx",
    "lint": "eslint src/ --ext .ts,.tsx --fix"
  },
  "keywords": [
    "jupyter",
    "jupyterlab",
    "jupyterlab-extension",
    "widgets",
    "ipython",
    "ipywidgets"
  ],
  "devDependencies": {
    "@jupyterlab/builder": "^3.0.0",
    "@types/expect.js": "^0.3.29",
    "@types/mocha": "^9.0.0",
    "@types/node": "^16.10.2",
    "@types/react": "^17.0.26",
    "@typescript-eslint/eslint-plugin": "^4.4.0",
    "@typescript-eslint/parser": "^4.4.0",
    "acorn": "^8.5.0",
    "application": "npm:@phosphor/application@^1.7.3",
    "buffer": "^6.0.3",
    "eslint": "^7.19.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-office-addins": "^1.0.3",
    "eslint-plugin-prettier": "^4.0.0",
    "eslint-plugin-react": "^7.26.1",
    "expect.js": "^0.3.1",
    "fs-extra": "^10.0.0",
    "mkdirp": "^1.0.4",
    "mocha": "^9.1.2",
    "npm-run-all": "^4.1.5",
    "prettier": "^2.0.5",
    "rimraf": "^3.0.2",
    "typescript": "^4.4.3",
    "widgets": "npm:@phosphor/widgets@^1.9.3"
  },
  "main": "lib/index.js",
  "homepage": "https://github.com/mito-ds/monorepo",
  "types": "./lib/index.d.ts",
  "description": "The Mito Spreadsheet"
}"""

MITOSHEET_PACKAGE_JSON = """{
  "files": [
    "lib/**/*.js",
    "fonts/**/*",
    "dist/*.js",
    "css/**/*.css",
    "style/index.js"
  ],
  "jupyterlab": {
    "outputDir": "mitosheet/labextension",
    "extension": "lib/plugin"
  },
  "name": "REPLACE_WITH_PACKAGE_NAME_WITH_REPLACE",
  "license": "AGPL-3.0-only",
  "author": {
    "name": "Mito Sheet",
    "email": "naterush1997@gmail.com"
  },
  "bugs": {
    "url": "https://github.com/mito-ds/monorepo/issues"
  },
  "repository": {
    "url": "https://github.com/mito-ds/monorepo",
    "type": "git"
  },
  "version": "0.3.131",
  "dependencies": {
    "@jupyter-widgets/base": "^4",
    "@jupyterlab/notebook": "^3.0.6",
    "@types/fscreen": "^1.0.1",
    "@types/react-dom": "^17.0.2",
    "fscreen": "^1.1.0",
    "react": "^17.0.1",
    "react-dom": "^17.0.1"
  },
  "scripts": {
    "clean:lib": "rimraf lib tsconfig.tsbuildinfo",
    "clean:nbextension": "rimraf mitosheet/nbextension",
    "clean:labextension": "rimraf mitosheet/labextension",
    "clean:all": "jlpm run clean:lib && jlpm run clean:nbextension && jlpm run clean:labextension",
    "clean": "npm run clean:all",

    "build:nbextension:dev": "webpack --mode=development",
    "build:labextension:dev": "jupyter labextension build --development True .",
    "build:all:dev": "npm run build:nbextension:dev && build:labextension:dev",
    "build:dev": "npm run build:all:dev",
    
    "build:lib": "tsc",
    "build:nbextension": "webpack --mode=production",
    "build:labextension": "jupyter labextension build .",
    "build:all": "npm run build:lib && npm run build:labextension && npm run build:nbextension",
    "build": "npm run build:all",

    "watch:lib": "tsc -w",
    "watch:nbextension": "webpack --watch --mode=development",
    "watch:labextension": "jupyter labextension watch .",
    "watch:all": "run-p watch:lib watch:labextension watch:nbextension",
    "watch": "npm run watch:all",
    
    "lint:check": "eslint src/ --ext .ts,.tsx",
    "lint": "eslint src/ --ext .ts,.tsx --fix",

    "prepare": "jlpm run clean && jlpm run build:all",
    "prepack": "npm run build:all"
  },
  "keywords": [
    "jupyter",
    "jupyterlab",
    "jupyterlab-extension",
    "widgets",
    "ipython",
    "ipywidgets"
  ],
  "devDependencies": {
    "@jupyterlab/builder": "^3.0.0",
    "@types/expect.js": "^0.3.29",
    "@types/node": "^16.10.2",
    "@types/react": "^17.0.26",
    "@typescript-eslint/eslint-plugin": "^4.8.1",
    "@typescript-eslint/parser": "^4.8.1",
    "acorn": "^8.5.0",
    "application": "npm:@lumino/application@^1.13.1",
    "eslint": "^7.14.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-office-addins": "^1.0.3",
    "eslint-plugin-prettier": "^4.0.0",
    "eslint-plugin-react": "^7.21.3",
    "expect.js": "^0.3.1",
    "fs-extra": "^10.0.0",
    "mkdirp": "^1.0.4",
    "mocha": "^9.1.2",
    "npm-run-all": "^4.1.5",
    "prettier": "^2.1.1",
    "rimraf": "^3.0.2",
    "typescript": "^4.4.3",
    "widgets": "npm:@lumino/widgets@^1.16.1"
  },
  "main": "lib/index.js",
  "homepage": "https://trymito.io",
  "types": "./lib/index.d.ts",
  "description": "The Mito Spreadsheet",
  "resolutions": {
    "@types/react": "^17.0.2"
  }
}"""


def try_delete_folder_or_files(*paths):
    """
    Helper function that attempts to delete all of the passed paths,
    and does not fail if they do not exist. 
    """

    for path in paths:
        try:
            if os.path.isdir(path):
                shutil.rmtree(path)
            else:
                os.remove(path)
            print('Removed', path)
        except Exception as e:
            print("Failed to remove", path, e)
            pass



def switch(new_package):
    """
    Switches the package.json from the currently set package to the new_package,
    which must be mitosheet, mitosheet2, or mitosheet3. Does so by updating the name, version
    dependencies, and removing some ghost files that might be hanging around.
    """

    # First, we delete all the files that we don't want hanging around
    try_delete_folder_or_files(
        # Delete as we want to refresh these
        './node_modules', 
        'package-lock.json', 
        # Delete all egg-info files as they cause local pip install to install
        # out of dates packages otherwise
        *list(filter(lambda x: x.endswith('egg-info'), os.listdir('.')))
    )

    # Then, update the package.json
    if new_package == 'mitosheet2':
      open('package.json', 'w').write(MITOSHEET_TWO_PACKAGE_JSON)
    elif new_package == 'mitosheet':    
      open('package.json', 'w').write(MITOSHEET_PACKAGE_JSON.replace('REPLACE_WITH_PACKAGE_NAME_WITH_REPLACE', 'mitosheet'))
    elif new_package == 'mitosheet3':    
      open('package.json', 'w').write(MITOSHEET_PACKAGE_JSON.replace('REPLACE_WITH_PACKAGE_NAME_WITH_REPLACE', 'mitosheet3'))

    
if __name__ == '__main__':

    package_json = json.loads(open('package.json').read())
    new_package, curr_package = sys.argv[1], package_json['name']

    if new_package == curr_package:
        print(f'You may not need to switch, as {new_package} is already the current package. Refreshing anyways.')

    valid_package_names = [
      'mitosheet2',
      'mitosheet',
      'mitosheet3',
    ]

    # Sanity check!
    assert new_package in valid_package_names

    switch(new_package)