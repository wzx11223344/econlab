#!/usr/bin/env python3
"""Setup script for EconomicsLab."""

import os
import re
from setuptools import setup, find_packages


def read(*parts):
    """Read file contents relative to setup.py."""
    here = os.path.abspath(os.path.dirname(__file__))
    with open(os.path.join(here, *parts), "r", encoding="utf-8") as f:
        return f.read()


def find_version(*file_paths):
    """Extract version string from __init__.py."""
    version_file = read(*file_paths)
    version_match = re.search(
        r"^__version__\s*=\s*['\"]([^'\"]*)['\"]", version_file, re.M
    )
    if version_match:
        return version_match.group(1)
    raise RuntimeError("Unable to find version string.")


setup(
    name="econlab",
    version=find_version("econlab", "__init__.py"),
    description="Interactive Economics Computing Laboratory",
    long_description=read("README.md"),
    long_description_content_type="text/markdown",
    author="EconomicsLab Contributors",
    author_email="contributors@econlab.dev",
    url="https://github.com/econlab/econlab",
    project_urls={
        "Documentation": "https://econlab.dev/docs",
        "Source": "https://github.com/econlab/econlab",
        "Bug Tracker": "https://github.com/econlab/econlab/issues",
    },
    packages=find_packages(exclude=["tests*", "docs*"]),
    include_package_data=True,
    python_requires=">=3.9",
    install_requires=[
        "numpy>=1.24.0",
        "pandas>=2.0.0",
        "scipy>=1.10.0",
        "matplotlib>=3.7.0",
        "seaborn>=0.12.0",
        "statsmodels>=0.14.0",
        "linearmodels>=5.1",
        "scikit-learn>=1.3.0",
        "plotly>=5.15.0",
    ],
    extras_require={
        "full": [
            "jupyter>=1.0.0",
            "ipywidgets>=8.0.0",
            "nbformat>=5.9.0",
            "openpyxl>=3.1.0",
            "xlrd>=2.0.0",
            "econml>=0.14.0",
        ],
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
            "pre-commit>=3.0.0",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "Intended Audience :: Education",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Scientific/Engineering",
        "Topic :: Scientific/Engineering :: Information Analysis",
        "Topic :: Scientific/Engineering :: Visualization",
        "Topic :: Education",
    ],
    keywords="economics econometrics statistics data-analysis causal-inference",
)
