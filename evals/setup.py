from setuptools import setup, find_packages

setup(
    name="mito-evals",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        "mypy>=1.0.0",
        "types-setuptools",
    ],
)