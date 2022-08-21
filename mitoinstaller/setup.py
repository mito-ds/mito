from distutils.core import setup
from mitoinstaller import __version__
from setuptools import find_packages

setup(
    name                = 'mitoinstaller',
    version             = __version__,
    packages            = find_packages(where='.', exclude='tests'),
    install_requires    = ['analytics-python', 'colorama', 'termcolor'],
    author              = 'Mito',
    author_email        = 'naterush1997@gmail.com',
    license             = 'AGPL-3.0-only',
    url                 = 'https://github.com/mito-ds/monorepo',
    long_description    = 'The mitoinstaller package allows you to install the mitosheet package in your local JupyterLab instance. It logs anonymous data about installation, including if it is successful or why it failed.',
    keywords            = ['Jupyter', 'Widgets', 'IPython'],
)
