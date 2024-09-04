from setuptools import setup, find_packages

# Setup.py used to be the default configuration file for python packages. 
# Now, pyproject.toml is the default configuration file for python packages.
# This file is here for compatibility with older build systems.

__import__("setuptools").setup()
setup(
    name="mito-ai",
    version="0.1.0",
    author="Aaron Diamond-Reivich",
    author_email="aaron@sagacollab.com",
    description="A description of your project", 
    keywords=['chatbot', 'AI', 'NLP'], 
    packages=find_packages(),
    # ... other setup arguments ...
)