from setuptools import setup, find_packages
import json
from pathlib import Path

HERE = Path(__file__).parent.resolve()
package_json = json.loads(open('package.json').read())

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
        "setuptools",
        "jupyterlab>=4.0.0,<5",
        "openai",
    ],
    extras_require = {
        'deploy': [
            'wheel==0.42.0', 
            'twine==5.1.1',
            "setuptools==56.0.0"
        ],
    },
    keywords=["AI", "Jupyter", "Mito"],
    entry_points={
        "jupyter_serverproxy_servers": [
            "mito-ai = mito_ai:_load_jupyter_server_extension",
        ],
    },
    include_package_data=True,  # Ensures labextension files are included
    package_data={
        "": ["labextension/**/*", "labextension/install.json"],
    },
    data_files=[
        (
            "share/jupyter/labextensions/mito-ai", 
            [
                "mito-ai/labextension/static/style.js", 
                "mito-ai/labextension/package.json",
                "mito-ai/labextension/install.json"
            ]
        ),
    ],
    zip_safe=False,
)