from glob import glob
from typing import List, Tuple
from setuptools import setup, find_packages
import json
from pathlib import Path
import os

HERE = Path(__file__).parent.resolve()
package_json = json.loads(open('package.json').read())
lab_path = Path(HERE, 'mito_ai', 'labextension')


data_files_spec = [
    # Lab extension data files
    ("share/jupyter/labextensions/mito-ai", str(lab_path), "**"),
    ("share/jupyter/labextensions/mito-ai", str(HERE), "install.json")
]

def get_data_files_from_data_files_spec(
    data_specs: List[Tuple[str, str, str]],
):
    """
    Given tuples of (data_file_path, directory_to_search, pattern_to_find),
    this function will return a list of tuples of (data_file_path, [files])
    in the format that setuptools expects.
    """
    file_data = {}
    for (data_file_path, directory_to_search, pattern_to_find) in data_specs or []:
        # Get the directory to search ready
        if os.path.isabs(directory_to_search):
            directory_to_search = os.path.relpath(directory_to_search)
        directory_to_search = directory_to_search.rstrip("/")
        # Get all non-directory files that match the pattern, searching recursively
        files = [
            f for f in glob(
                Path().joinpath(directory_to_search, pattern_to_find).as_posix(), 
                recursive=True
            ) if not os.path.isdir(f)
        ]
        offset = len(directory_to_search) + 1
        for file_name in files:
            relative_path = str(Path(file_name).parent)[offset:]
            full_data_file_path = Path().joinpath(data_file_path, relative_path).as_posix()
            if full_data_file_path not in file_data:
                file_data[full_data_file_path] = []
            file_data[full_data_file_path].append(file_name)
    # Turn to list and sort by length, to be consistent (and maybe cuz we need to for folder creation?)
    data_files = sorted(file_data.items(), key=lambda x: len(x[0]))
    
    return data_files

data_files = get_data_files_from_data_files_spec(data_files_spec) 

# Add the jupyter server config file so that the extension is automatically loaded
data_files.append(("etc/jupyter/jupyter_server_config.d", ["jupyter-config/jupyter_server_config.d/mito-ai.json"]))

# Read the content of README.md for the long description
with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="mito-ai",
    version=package_json['version'],
    author="Aaron Diamond-Reivich",
    author_email="aaron@sagacollab.com",
    description="AI chat for JupyterLab",
    long_description=long_description,
    long_description_content_type="text/markdown",
    license="GNU Affero General Public License v3",
    python_requires=">=3.8",
    classifiers=[
        "Framework :: Jupyter",
        "Framework :: Jupyter :: JupyterLab",
        "Framework :: Jupyter :: JupyterLab :: 4",
        "Framework :: Jupyter :: JupyterLab :: Extensions",
        "Framework :: Jupyter :: JupyterLab :: Extensions :: Prebuilt",
        "License :: OSI Approved :: BSD License",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    packages=find_packages(),
    install_requires=[
        "jinja2>=3.0.3",
        "jupyterlab>=4.0.0,<5",
        "openai>=1.0.0",
        'analytics-python',
        "tornado>=6.2.0",
        "traitlets",
    ],
    extras_require = {
        'deploy': [
            'wheel==0.42.0', 
            'twine==5.1.1',
            'setuptools==68.0.0'
            
        ],
        'test': [
            'pytest==8.3.4',
        ],
    },
    keywords=["AI", "Jupyter", "Mito"],
    entry_points={
        "jupyter_serverproxy_servers": [
            "mito-ai = mito_ai:_load_jupyter_server_extension",
        ],
    },
    jupyter_server_extension="mito_ai", # Automatically enable the server extension 
    include_package_data=True,  # Ensures labextension files are included
    package_data={
        "": ["labextension/**/*"],
    },
    data_files=data_files,
    zip_safe=False,
)