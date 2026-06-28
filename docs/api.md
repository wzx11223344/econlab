# EconomicsLab API Reference

> Version: 0.1.0 | Last Updated: 2026-06-28

---

## Table of Contents

1. [Package Overview](#package-overview)
2. [Datasets Module](#datasets-module)
3. [Package Metadata](#package-metadata)

---

## Package Overview

### `econlab`

The root package provides version information and re-exports the most
commonly used functions.

```python
import econlab

print(econlab.__version__)  # "0.1.0"
```

**Exported Symbols:**

| Symbol | Description |
|---|---|
| `__version__` | Package version string (semver) |
| `load_nlsy()` | Load NLSY mock panel dataset |
| `load_angrist_krueger()` | Load Angrist-Krueger 1991 QOB dataset |
| `load_card_minwage()` | Load Card 1995 minimum wage dataset |
| `list_datasets()` | List all available built-in datasets |
| `get_dataset_info(name)` | Get metadata for a specific dataset |

---

## Datasets Module

### `econlab.datasets`

The `datasets` module provides functions to load classic economics datasets
as pandas DataFrames. All data is generated synthetically (mock data) but
patterned after the original sources.

---

### `load_nlsy()`

```python
def load_nlsy() -> pd.DataFrame
```

Load a mock National Longitudinal Survey of Youth (NLSY) panel dataset.

**Description**

Generates a simulated balanced panel dataset with 5,000 individuals
observed over 10 years (1979-1988). Variables include demographics,
human capital measures, and labor market outcomes.

**Returns**

| Type | Description |
|---|---|
| `pd.DataFrame` | Panel data with 50,000 rows and 12 columns |

**Columns**

| Column | Type | Description |
|---|---|---|
| `id` | int64 | Individual identifier (1-5000) |
| `year` | int64 | Survey year (1979-1988) |
| `age` | int64 | Age in years |
| `female` | int64 | 1 if female, 0 if male |
| `race` | int64 | 0=White, 1=Black, 2=Other |
| `education` | int64 | Years of schooling |
| `experience` | float64 | Potential labor market experience |
| `tenure` | float64 | Years with current employer |
| `log_wage` | float64 | Natural log of hourly wage |
| `wage` | float64 | Hourly wage in dollars |
| `hours` | float64 | Weekly hours worked |
| `union` | int64 | 1 if union member, 0 otherwise |

**Example**

```python
from econlab.datasets import load_nlsy

df = load_nlsy()
print(df.groupby("year")["log_wage"].mean())
```

**Notes**

This is synthetic mock data. For real NLSY data, visit the
[Bureau of Labor Statistics NLS page](https://www.bls.gov/nls/).

---

### `load_angrist_krueger()`

```python
def load_angrist_krueger() -> pd.DataFrame
```

Load mock data patterned after Angrist & Krueger (1991).

**Description**

Generates synthetic cross-sectional data with quarter-of-birth (QOB)
as an instrument for education. The original study used 1920-1929
Census data to estimate returns to schooling.

**Returns**

| Type | Description |
|---|---|
| `pd.DataFrame` | Cross-sectional data with 2,000 rows |

**Columns**

| Column | Type | Description |
|---|---|---|
| `log_wage` | float64 | Log weekly wage |
| `wage` | float64 | Weekly wage in dollars |
| `education` | int64 | Years of completed schooling |
| `yob` | int64 | Year of birth (1930-1939) |
| `qob` | int64 | Quarter of birth (1-4) |
| `quarter_born` | int64 | Alias for qob |
| `age` | float64 | Age in quarters |

**Example**

```python
from econlab.datasets import load_angrist_krueger
import statsmodels.api as sm

df = load_angrist_krueger()

# First stage: education on QOB dummies
# Second stage: log_wage on predicted education
from linearmodels.iv import IV2SLS

iv_model = IV2SLS(
    dependent=df["log_wage"],
    exog=None,
    endog=df["education"],
    instruments=df[["qob"]],
)
results = iv_model.fit()
print(results.summary)
```

**References**

Angrist, J. D. & Krueger, A. B. (1991). "Does Compulsory School
Attendance Affect Schooling and Earnings?" *Quarterly Journal of
Economics*, 106(4), 979-1014.

---

### `load_card_minwage()`

```python
def load_card_minwage() -> pd.DataFrame
```

Load mock data patterned after Card & Krueger (1994) / Card (1995).

**Description**

Generates synthetic restaurant-level panel data from the 1992 New Jersey
minimum wage increase study. Includes fast-food restaurants in New Jersey
(treatment) and eastern Pennsylvania (control) surveyed before and after
the policy change.

**Returns**

| Type | Description |
|---|---|
| `pd.DataFrame` | Panel data with 400 rows |

**Columns**

| Column | Type | Description |
|---|---|---|
| `store_id` | int64 | Restaurant identifier |
| `state` | str | 'NJ' or 'PA' |
| `treated` | int64 | 1 for NJ (treatment), 0 for PA (control) |
| `time_period` | str | 'before' or 'after' the policy change |
| `post` | int64 | 1 for after period, 0 for before |
| `fte` | float64 | Full-time equivalent employment |
| `wage` | float64 | Starting wage in dollars |

**Example (Difference-in-Differences)**

```python
from econlab.datasets import load_card_minwage
import statsmodels.formula.api as smf

df = load_card_minwage()

# DiD regression
model = smf.ols("fte ~ treated + post + treated:post", data=df)
results = model.fit(cov_type="HC1")
print(results.summary())
```

**References**

Card, D. & Krueger, A. B. (1994). "Minimum Wages and Employment:
A Case Study of the Fast-Food Industry in New Jersey and
Pennsylvania." *American Economic Review*, 84(4), 772-793.

---

### `list_datasets()`

```python
def list_datasets() -> List[str]
```

List all available built-in dataset names.

**Returns**

| Type | Description |
|---|---|
| `list[str]` | Alphabetically sorted list of dataset names |

**Example**

```python
from econlab.datasets import list_datasets
print(list_datasets())
# ['angrist_krueger', 'card_minwage', 'nlsy']
```

---

### `get_dataset_info(name)`

```python
def get_dataset_info(name: str) -> Dict[str, Any]
```

Get metadata for a specific dataset.

**Parameters**

| Parameter | Type | Description |
|---|---|---|
| `name` | `str` | Dataset name (one of the keys from `list_datasets()`) |

**Returns**

| Type | Description |
|---|---|
| `dict` | Metadata dictionary with keys: `name`, `description`, `source`, `n_obs`, `n_vars`, `time_range`, `variables`, `reference` |

**Raises**

| Exception | Condition |
|---|---|
| `ValueError` | If `name` is not a valid dataset |

**Example**

```python
from econlab.datasets import get_dataset_info

info = get_dataset_info("angrist_krueger")
print(info["reference"])
```

---

### `clear_cache()`

```python
def clear_cache() -> None
```

Clear the internal dataset cache. After calling this, the next call to
any `load_*()` function will regenerate the synthetic data from scratch.

---

## Package Metadata

```python
econlab.__version__  # "0.1.0"
econlab.__author__   # "EconomicsLab Contributors"
econlab.__license__  # "MIT"
```

---

## Index

| Function | Module | Description |
|---|---|---|
| `load_nlsy` | `econlab.datasets` | Load NLSY mock panel data |
| `load_angrist_krueger` | `econlab.datasets` | Load Angrist-Krueger 1991 QOB data |
| `load_card_minwage` | `econlab.datasets` | Load Card 1995 minimum wage data |
| `list_datasets` | `econlab.datasets` | List available datasets |
| `get_dataset_info` | `econlab.datasets` | Get dataset metadata |
| `clear_cache` | `econlab.datasets` | Clear dataset cache |
