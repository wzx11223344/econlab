"""
Built-in economics datasets for EconomicsLab.

This module provides convenient access to classic economics datasets
commonly used in empirical research and teaching.

Available Datasets
------------------
- NLSY (National Longitudinal Survey of Youth) -- Mock panel data
- Angrist-Krueger 1991 -- Returns to education (QOB instrument)
- Card 1995 / Card-Krueger 1994 -- Minimum wage and employment

Usage
-----
>>> from econlab.datasets import load_angrist_krueger
>>> df = load_angrist_krueger()
>>> df.describe()
"""

from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd
import warnings


# ---------------------------------------------------------------------------
# Dataset Registry
# ---------------------------------------------------------------------------

DATASET_REGISTRY: Dict[str, Dict[str, Any]] = {
    "nlsy": {
        "name": "National Longitudinal Survey of Youth (NLSY)",
        "description": (
            "A mock panel dataset simulating the NLSY79 and NLSY97 cohorts. "
            "Contains demographic, education, and labor market variables for "
            "approximately 5,000 individuals over 10 years."
        ),
        "source": "Bureau of Labor Statistics, U.S. Department of Labor",
        "n_obs": 5000,
        "n_vars": 12,
        "time_range": "1979-1997",
        "variables": [
            "id", "year", "age", "female", "race",
            "education", "experience", "tenure",
            "wage", "hours", "union",
        ],
        "reference": "NLSY User Guide (BLS, 2019)",
    },
    "angrist_krueger": {
        "name": "Angrist & Krueger (1991) Returns to Education",
        "description": (
            "Quarter-of-birth instrument for compulsory schooling laws. "
            "Contains log weekly wage, years of schooling, and census "
            "division dummies for 329,509 men born 1930-1939."
        ),
        "source": "Angrist, J. D. & Krueger, A. B. (1991). "
                  "Does Compulsory School Attendance Affect "
                  "Schooling and Labor Market Outcomes? "
                  "The Quarterly Journal of Economics, 106(4), 979-1014.",
        "n_obs": 329509,
        "n_vars": 8,
        "time_range": "1920-1929",
        "variables": [
            "log_wage", "education", "age",
            "age_squared", "region", "quarter_born",
            "yob", "sob",
        ],
        "reference": "Angrist & Krueger (1991), QJE",
    },
    "card_minwage": {
        "name": "Card & Krueger (1994/1995) Minimum Wage",
        "description": (
            "Difference-in-differences analysis of the 1992 New Jersey "
            "minimum wage increase on fast-food employment in Pennsylvania. "
            "Contains store-level employment, wages, and prices for "
            "410 restaurants before and after the policy change."
        ),
        "source": "Card, D. & Krueger, A. B. (1994). "
                  "Minimum Wages and Employment: A Case Study of "
                  "Fast-Food Restaurants in New Jersey and Pennsylvania. "
                  "The American Economic Review, 84(4), 772-792. ",
        "n_obs": 410,
        "n_vars": 6,
        "time_range": "1992-1993",
        "variables": [
            "store_id", "state", "time_period",
            "fte_before", "fte_after",
            "wage_before", "wage_after",
        ],
        "reference": "Card & Krueger (1994), AER",
    },
}


# ---------------------------------------------------------------------------
# Data Generation Utilities
# ---------------------------------------------------------------------------

def _generate_nlsy(n_obs: int = 5000, seed: int = 42) -> pd.DataFrame:
    """
    Generate a mock NLSY panel dataset.

    Parameters
    ----------
    n_obs : int
        Number of individuals (observations).
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        Mock NLSY panel data with demographic, education,
        and labor market variables.

    Notes
    -----
    This generates synthetic data patterned after the NLSY79 and
    NLSY97 cohorts. Variables include demographics, human capital,
    and labor market outcomes. The data structure is a balanced
    panel (one observation per individual per year).
    """
    rng = np.random.default_rng(seed)
    n_years = 10
    n_persons = n_obs // n_years

    # Generate individual-level fixed effects
    person_ids = np.arange(1, n_obs + 1)

    # Time-varying demographic variables
    years = np.tile(np.arange(1, n_years + 1), n_persons)

    # Individual time-invariant characteristics
    female = rng.binomial(1, 0.5, n_obs).astype(float)
    race_vals = rng.choice([0, 1, 2, 3], n_obs)  # 0=White, 1=Black, 2=Hispanic, 3=Other

    data = pd.DataFrame({
        "id": person_ids,
        "year": years,
        "age": np.clip(18 + rng.normal(0, 5, n_obs), 18, 65).astype(int),
        "female": female,
        "race": race_vals,
        "education": np.clip(
            8 + rng.normal(0, 3, n_obs), 8, 20
        ).astype(int),
        "experience": np.clip(
            rng.normal(0, 10, n_obs), 0, 40
        ).astype(float),
        "tenure": np.clip(
            rng.normal(0, 5, n_obs), 0, 30
        ).astype(float),
        "wage": np.exp(rng.normal(2.5, 0.5, n_obs)),
        "hours": np.clip(
            20 + rng.normal(0, 10, n_obs), 0, 60
        ).astype(float),
        "union": rng.binomial(1, 0.2, n_obs).astype(float),
    })

    # Add variable labels
    data.columns = [
        "id", "year", "age", "female", "race",
        "education", "experience", "tenure",
        "log_wage", "hours", "union",
    ]
    return data


def _generate_angrist_krueger(
    n_obs: int = 329509, seed: int = 42
) -> pd.DataFrame:
    """
    Generate mock Angrist-Krueger 1991 QOB data.

    Parameters
    ----------
    n_obs : int
        Number of observations.
    seed : int
        Random seed.

    Returns
    -------
    pd.DataFrame
        Cross-sectional data with quarter-of-birth,
        education, and wage variables.

    Notes
    -----
    This generates synthetic cross-sectional data patterned after the
    1920-1929 Census. Data includes quarter of birth dummies,
    years of schooling, and log weekly wages for men born
    between 1930 and 1939.
    """
    rng = np.random.default_rng(seed)

    # Generate state dummies
    n_states = 51  # 48 contiguous US states + DC

    # Generate year-of-birth dummies
    n_yob_dummies = 10  # 1920-1929

    # Continuous variables
    log_wage = rng.lognormal(5.0, 0.8, n_obs)
    education = np.clip(
        8 + rng.normal(0, 3, n_obs), 8, 20
    ).astype(int)
    age = np.clip(
        25 + rng.normal(0, 10, n_obs), 14, 65
    ).astype(int)
    age_sq = age ** 2

    # Quarter-of-birth dummies
    yob_dummies = pd.get_dummies(
        rng.choice(np.arange(n_yob_dummies), n_obs)
    )
    yob_labels = [f"yob_{i}" for i in range(n_yob_dummies)]

    # State dummies
    state_dummies = pd.get_dummies(
        rng.choice(np.arange(1, n_states + 1), n_obs)
    )
    state_labels = [f"state_{i}" for i in range(n_states)]

    data = pd.DataFrame({
        "log_wage": log_wage,
        "education": education,
        "age": age,
        "age_sq": age_sq,
        "region": rng.choice(
            ["Northeast", "Midwest", "South", "West"],
            n_obs,
        ),
    })

    # Add categorical columns
    for label_arr, prefix in [
        (yob_dummies, "yob"),
        (state_dummies, "state"),
    ]:
        for col, label in zip(
            label_arr.columns, label_arr.columns
        ):
            data[f"{prefix}_{label}"] = label_arr[label]

    data["quarter_born"] = (
        data[[f"yob_{i}" for i in range(n_yob_dummies)]]
        .values
        .argmax(axis=1)
    )

    data.columns = [
        "log_wage", "education", "age", "age_sq",
        "quarter_born",
    ] + [f"state_{i}" for i in range(n_states)]

    return data


def _generate_card_minwage(
    n_obs: int = 410, seed: int = 42
) -> pd.DataFrame:
    """
    Generate mock Card-Krueger minimum wage data.

    Parameters
    ----------
    n_obs : int
        Number of restaurant-level observations.
    seed : int
        Random seed.

    Returns
    -------
    pd.DataFrame
        Panel data with employment, wage, and price
        variables for fast-food restaurants.

    Notes
    -----
    This generates synthetic restaurant-level panel data
    patterned after the Card & Krueger (1994) study of
    the 1992 New Jersey minimum wage increase. Data includes
    full-time equivalent (FTE) employment, starting wages,
    and meal prices for 410 restaurants in New Jersey
    and eastern Pennsylvania.
    """
    rng = np.random.default_rng(seed)

    # Generate restaurant IDs
    store_ids = np.arange(1, n_obs + 1)

    # State assignment (NJ or PA)
    states = rng.choice(["NJ", "PA"], n_obs)

    # Time period: before or after policy change
    time_period = rng.choice(["before", "after"], n_obs)

    # Employment (FTE) -- generate counts
    fte_before = np.clip(
        rng.poisson(20, n_obs), 0, 100
    ).astype(float)
    fte_after = np.clip(
        rng.poisson(20, n_obs), 0, 100
    ).astype(float)

    # Wages
    wage_before = np.exp(
        rng.normal(1.6, 0.2, n_obs)
    )
    wage_after = np.exp(
        rng.normal(1.8, 0.3, n_obs)
    )

    data = pd.DataFrame({
        "store_id": store_ids,
        "state": states,
        "time_period": time_period,
        "fte_before": fte_before,
        "fte_after": fte_after,
        "wage_before": wage_before,
        "wage_after": wage_after,
    })

    data.columns = [
        "store_id", "state", "time_period",
        "fte_before", "fte_after",
        "wage_before", "wage_after",
    ]
    return data


# ---------------------------------------------------------------------------
# Cache for loaded datasets
# ---------------------------------------------------------------------------

_dataset_cache: Dict[str, pd.DataFrame] = {}


def _cached(func):
    """Decorator to cache dataset loads."""
    def wrapper(*args, **kwargs):
        cache_key = func.__name__
        if cache_key not in _dataset_cache:
            _dataset_cache[cache_key] = func(*args, **kwargs)
        return _dataset_cache[cache_key].copy()
    return wrapper


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

@_cached
def load_nlsy() -> pd.DataFrame:
    """
    Load the NLSY mock panel dataset.

    Returns
    -------
    pd.DataFrame
        Panel data with columns: id, year, age, female, race,
        education, experience, tenure, log_wage, hours, union.

    References
    ----------
    Bureau of Labor Statistics, U.S. Department of Labor.
    NLSY79 and NLSY97 cohorts.
    """
    return _generate_nlsy()


@_cached
def load_angrist_krueger() -> pd.DataFrame:
    """
    Load the Angrist-Krueger (1991) returns-to-education dataset.

    Returns
    -------
    pd.DataFrame
        Cross-sectional QOB data with columns: log_wage,
        education, age, age_sq, quarter_born, and state dummies.

    References
    ----------
    Angrist, J. D. & Krueger, A. B. (1991). Does Compulsory
    School Attendance Affect Schooling and Labor Market
    Outcomes? The Quarterly Journal of Economics, 106(4),
    979-1014.
    """
    return _generate_angrist_krueger()


@_cached
def load_card_minwage() -> pd.DataFrame:
    """
    Load the Card-Krueger (1994/1995) minimum wage dataset.

    Returns
    -------
    pd.DataFrame
        Restaurant-level panel data with columns: store_id,
        state, time_period, fte_before, fte_after,
        wage_before, wage_after.

    References
    ----------
    Card, D. & Krueger, A. B. (1994). Minimum Wages and
    Employment: A Case Study of Fast-Food Restaurants in
    New Jersey and Pennsylvania. The American Economic
    Review, 84(4), 772-792.
    """
    return _generate_card_minwage()


def list_datasets() -> List[str]:
    """
    List all available built-in datasets.

    Returns
    -------
    list of str
        Names of all loadable datasets.

    Examples
    --------
    >>> list_datasets()
    ['nlsy', 'angrist_krueger', 'card_minwage']
    """
    return sorted(DATASET_REGISTRY.keys())


def get_dataset_info(name: str) -> Dict[str, Any]:
    """
    Get metadata for a specific dataset.

    Parameters
    ----------
    name : str
        Name of the dataset (must be a key in DATASET_REGISTRY).

    Returns
    -------
    dict
        Metadata dictionary with keys: name, description, source,
        n_obs, n_vars, time_range, variables, reference.

    Raises
    ------
    ValueError
        If the dataset name is not found in the registry.

    Examples
    --------
    >>> info = get_dataset_info("nlsy")
    >>> info["name"]
    'National Longitudinal Survey of Youth (NLSY)'
    """
    if name not in DATASET_REGISTRY:
        available = ", ".join(sorted(DATASET_REGISTRY.keys()))
        raise ValueError(
            f"Dataset '{name}' not found. Available datasets: {available}"
        )
    return dict(DATASET_REGISTRY[name])


def clear_cache() -> None:
    """
    Clear the internal dataset cache to free memory.

    Notes
    -----
    Datasets are cached after first load to avoid regeneration.
    Use this if you need fresh data generation.
    """
    _dataset_cache.clear()
