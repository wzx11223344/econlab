"""
EconomicsLab - Interactive Economics Computing Laboratory.
=========================================================

EconomicsLab is a comprehensive Python toolkit for economics research,
teaching, and data analysis. It provides built-in datasets, econometric
modeling tools, and an interactive web dashboard.

Modules
-------
- datasets  : Built-in economics datasets (NLSY, Angrist-Krueger, Card, etc.)
- webapp    : Interactive web dashboard for model exploration

Quick Start
-----------
>>> import econlab
>>> print(econlab.__version__)
>>> from econlab.datasets import load_angrist_krueger
>>> df = load_angrist_krueger()
"""

__version__ = "0.1.0"
__author__ = "EconomicsLab Contributors"
__license__ = "MIT"

from econlab.datasets import (
    load_angrist_krueger,
    load_card_minwage,
    load_nlsy,
    list_datasets,
    get_dataset_info,
)

__all__ = [
    "__version__",
    "load_nlsy",
    "load_angrist_krueger",
    "load_card_minwage",
    "list_datasets",
    "get_dataset_info",
]
