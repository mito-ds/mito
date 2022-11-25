"""
The switch.py package is responsible for switching the environment
between mitosheet and mitosheet-private. Usage is:
```
python switch.py [mitosheet | mitosheet-private]
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

    # Open the current package.json
    with open('package.json', 'r') as f:
      package_json_str = f.read()
      package_json = json.loads(package_json_str)

    old_package = package_json['name']
    new_package_json = package_json_str.replace(f'"name": "{old_package}"', f'"name": "{new_package}"')

    open('package.json', 'w').write(new_package_json)
    
if __name__ == '__main__':

    package_json = json.loads(open('package.json').read())
    new_package, curr_package = sys.argv[1], package_json['name']

    if new_package == curr_package:
        print(f'You may not need to switch, as {new_package} is already the current package. Refreshing anyways.')

    valid_package_names = [
      'mitosheet',
      'mitosheet-private'
    ]

    # Sanity check!
    assert new_package in valid_package_names

    switch(new_package)