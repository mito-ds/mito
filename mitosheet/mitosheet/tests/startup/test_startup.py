
from installer.mitoinstaller.create_startup_file import IMPORT_MITOSHEET_FILE_CONTENTS as installer_file_contents
from mitosheet.startup.startup_utils import IMPORT_MITOSHEET_FILE_CONTENTS as mitosheet_file_contents
import os
import subprocess

IMPORT_MITOSHEET_FILE_PATH = os.path.join(os.path.expanduser("~"), '.ipython', 'profile_default', 'startup', 'import_mitosheet.py')

def test_create_startup_file():
    subprocess.run(['python', '-m', 'mitosheet', 'turnondataframebutton'])
    assert os.path.exists(IMPORT_MITOSHEET_FILE_PATH) 

    subprocess.run(['python', '-m', 'mitosheet', 'turnoffdataframebutton'])
    assert not os.path.exists(IMPORT_MITOSHEET_FILE_PATH) 

    subprocess.run(['python', '-m', 'mitosheet', 'turnoffdataframebutton'])
    subprocess.run(['python', '-m', 'mitosheet', 'turnondataframebutton'])
    assert os.path.exists(IMPORT_MITOSHEET_FILE_PATH) 


def test_file_contents_in_sync():
    assert installer_file_contents == mitosheet_file_contents