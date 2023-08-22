#!/usr/bin/env python
# coding: utf-8

"""
The mitosheet_private package is a wrapper around the mitosheet package.
"""

from setuptools import setup

python_requires='>=3.4'

name = 'mitosheet_private'

setup_args = dict(
    name                    = name,
    version                 = '0.3.0',
    url                     = 'https://github.com/mito-ds/mito',
    author                  = 'Aaron Diamond-Reivich',
    author_email            = 'aarondr77@gmail.con',
    description             = 'The mitosheet_private package is a wrapper around the mitosheet package.',
    license                 = "GNU Affero General Public License v3",
    long_description="""
    To learn more about Mito, checkout out our documentation: https://docs.trymito.io/getting-started/installing-mito\n\n
    Before installing Mito \n\n
    1. Check that you have Python 3.6 or above. To check your version of Python, open a new terminal, and type python3 --version. If you need to install or update Python, restart your terminal after doing so.\n\n
    2. Checkout our terms of service and privacy policy. By installing Mito, you're agreeing to both of them. Please contact us at aaron [@] sagacollab [dot] com with any questions.\n\n
    Installation Instructions \n\n
    For more detailed installation instructions, see our documentation: https://docs.trymito.io/getting-started/installing-mito\n\n
    1. pip install mitosheet\n\n
    2. Launch JupyterLab 3.0 and open a new notebook\n\n
    3. In the notebook, run the following code:\n\n
    import mitosheet\n\n
    mitosheet.sheet()\n\n
    """,
    long_description_content_type = "text/markdown",
    install_requires=[        
        # The mitosheet package is required
        'mitosheet>0.1.504',
    ],
    extras_require = {
        'deploy': [
            'wheel', 
            'twine',
            "setuptools==56.0.0"
        ],
    },
    zip_safe                = False,
    include_package_data    = True,
    python_requires         = ">=3.6",
    platforms               = "Linux, Mac OS X, Windows",
    classifiers             = [
        "License :: OSI Approved :: GNU Affero General Public License v3",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)

if __name__ == '__main__':
    setup(**setup_args)
