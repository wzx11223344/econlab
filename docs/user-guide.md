# EconomicsLab User Guide

> Version 0.1.0 | 2026-06-28

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Working with Datasets](#working-with-datasets)
5. [Econometric Models](#econometric-models)
    - [Ordinary Least Squares (OLS)](#ordinary-least-squares-ols)
    - [Instrumental Variables (IV/2SLS)](#instrumental-variables-iv2sls)
    - [Difference-in-Differences (DiD)](#difference-in-differences-did)
    - [Panel Fixed Effects](#panel-fixed-effects)
    - [Logit / Probit](#logit--probit)
6. [Web Dashboard](#web-dashboard)
7. [Jupyter Tutorial](#jupyter-tutorial)
8. [FAQ](#faq)
9. [Citing EconomicsLab](#citing-economicslab)

---

## Introduction

EconomicsLab is an open-source, interactive economics computing laboratory.
It combines built-in datasets, econometric modeling tools, a Jupyter tutorial
notebook, and a web-based dashboard into a single package. It is designed for:

- **Researchers** who need quick access to classic datasets and model templates
- **Educators** teaching econometrics with hands-on examples
- **Students** learning causal inference and applied microeconomics

The package is MIT-licensed and welcomes community contributions.

---

## Installation

### Requirements

- Python 3.9 or later
- pip (Python package installer)

### Basic Installation

```bash
pip install econlab
```

### Full Installation (with Jupyter support)

```bash
pip install econlab[full]
```

### Development Installation

```bash
git clone https://github.com/econlab/econlab.git
cd econlab
pip install -e ".[dev]"
```

### Verify Installation

```python
import econlab
print(econlab.__version__)  # Should print "0.1.0"
```

---

## Quick Start

```python
import econlab
from econlab.datasets import load_nlsy, list_datasets

# List all available datasets
print(list_datasets())  # ['angrist_krueger', 'card_minwage', 'nlsy']

# Load a dataset
df = load_nlsy()

# Explore
print(df.shape)          # (2500, 12)
print(df.columns.tolist())
print(df.describe())
```

---

## Working with Datasets

EconomicsLab ships with three built-in datasets:

### NLSY (Mock Panel Data)

```python
from econlab.datasets import load_nlsy

df = load_nlsy()

# Panel summary
print(df.groupby("year")[["log_wage", "education"]].mean())

# Mincer wage regression
import statsmodels.formula.api as smf
model = smf.ols(
    "log_wage ~ education + experience + I(experience**2) + female",
    data=df,
)
results = model.fit(cov_type="cluster", cov_kwds={"groups": df["id"]})
print(results.summary())
```

### Angrist-Krueger 1991

```python
from econlab.datasets import load_angrist_krueger

df = load_angrist_krueger()

# Examine the instrument relevance
import seaborn as sns
sns.boxplot(data=df, x="qob", y="education")
```

### Card 1995 Minimum Wage

```python
from econlab.datasets import load_card_minwage

df = load_card_minwage()

# DiD means table
print(df.groupby(["state", "time_period"])["fte"].mean().unstack())
```

---

## Econometric Models

### Ordinary Least Squares (OLS)

The workhorse of applied econometrics.

```python
import statsmodels.api as sm
from econlab.datasets import load_nlsy

df = load_nlsy()

X = sm.add_constant(df[["education", "experience", "female"]])
y = df["log_wage"]

model = sm.OLS(y, X)
results = model.fit(cov_type="HC1")
print(results.summary())
```

### Instrumental Variables (IV/2SLS)

Address endogeneity using external instruments.

```python
from linearmodels.iv import IV2SLS
from econlab.datasets import load_angrist_krueger

df = load_angrist_krueger()

# QOB dummies as instruments for education
qob_dummies = pd.get_dummies(df["qob"], prefix="qob", drop_first=True)

model = IV2SLS(
    dependent=df["log_wage"],
    exog=None,
    endog=df["education"],
    instruments=qob_dummies,
)
results = model.fit()
print(results.summary)

# Check first-stage F-statistic (>10 is considered strong)
print(f"First-stage F: {results.first_stage.diagnostics['f.stat']}")
```

### Difference-in-Differences (DiD)

Estimate causal effects with panel data.

```python
from econlab.datasets import load_card_minwage
import statsmodels.formula.api as smf

df = load_card_minwage()

# Classic 2x2 DiD
model = smf.ols("fte ~ treated * post", data=df)
results = model.fit(cov_type="HC1")
print(results.summary())

# The coefficient on treated:post is the DiD estimate
did_estimate = results.params["treated:post"]
print(f"DiD Estimate: {did_estimate:.3f}")
```

### Panel Fixed Effects

Control for time-invariant unobserved heterogeneity.

```python
from linearmodels.panel import PanelOLS
from econlab.datasets import load_nlsy

df = load_nlsy()
df = df.set_index(["id", "year"])

model = PanelOLS(
    dependent=df["log_wage"],
    exog=df[["experience", "hours", "union"]],
    entity_effects=True,
)
results = model.fit()
print(results.summary)
```

### Logit / Probit

Binary choice models for limited dependent variables.

```python
import statsmodels.api as sm
from econlab.datasets import load_nlsy

df = load_nlsy()

X = sm.add_constant(df[["education", "experience", "female"]])
y = df["union"]

model = sm.Logit(y, X)
results = model.fit(disp=False)

# Marginal effects at the mean
marginal_effects = results.get_margeff()
print(marginal_effects.summary())
```

---

## Web Dashboard

EconomicsLab includes an interactive web dashboard that lets you run
econometric models without writing code.

### Launching the Dashboard

Simply open `econlab/webapp/index.html` in any modern browser. No server
required -- everything runs client-side.

Or serve with Python's built-in HTTP server:

```bash
cd econlab/webapp
python -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

### Dashboard Features

- **Model Selection**: OLS, IV/2SLS, DiD, Panel FE, Logit/Probit
- **Dataset Selection**: NLSY, Angrist-Krueger, Card Min Wage
- **Parameter Input**: Choose dependent/independent variables
- **Live Charts**: Interactive Plotly.js coefficient plots
- **Results Table**: Full regression output with SE, t-stats, p-values
- **Monte Carlo Simulation**: Explore estimator properties

---

## Jupyter Tutorial

The comprehensive tutorial notebook is located at:
`econlab/notebooks/tutorial.ipynb`

### Launching

```bash
jupyter notebook econlab/notebooks/tutorial.ipynb
```

### Sections Covered

1. Introduction and Setup
2. Descriptive Statistics and Visualization
3. Ordinary Least Squares (OLS)
4. Instrumental Variables (IV/2SLS)
5. Difference-in-Differences (DiD)
6. Panel Data and Fixed Effects
7. Binary Choice Models (Logit/Probit)
8. Regression Discontinuity Design (RDD)
9. LASSO for Variable Selection
10. Bootstrap Inference

---

## FAQ

### Q: Is the data real?

A: No. All built-in datasets are synthetically generated (mock data)
patterned after classic economics papers. For real data, please refer
to the original sources cited in each dataset's documentation.

### Q: Can I use this for production research?

A: The built-in datasets are synthetic and should NOT be used for
publication. However, the code patterns and model specifications are
production-quality and can be applied to real data.

### Q: How do I contribute a new dataset?

A: See [CONTRIBUTING.md](https://github.com/econlab/econlab/blob/main/CONTRIBUTING.md)
for detailed guidelines. In short: fork the repo, add your loader to
`datasets.py`, update the registry, and submit a PR.

### Q: Does it support clustered standard errors?

A: Yes. Use `cov_type="cluster"` with `cov_kwds={"groups": df["id"]}`
in statsmodels, or set `cluster_entity=True` in linearmodels.

### Q: What Python version do I need?

A: Python 3.9 or later.

### Q: Is there a CLI?

A: Not yet. CLI support is planned for v0.2.0.

---

## Citing EconomicsLab

If you use EconomicsLab in your research or teaching, please cite:

```bibtex
@software{econlab2026,
  author    = {EconomicsLab Contributors},
  title     = {EconomicsLab: Interactive Economics Computing Laboratory},
  year      = {2026},
  version   = {0.1.0},
  url       = {https://github.com/econlab/econlab},
  license   = {MIT}
}
```

---

## Getting Help

- **GitHub Issues**: [https://github.com/econlab/econlab/issues](https://github.com/econlab/econlab/issues)
- **GitHub Discussions**: [https://github.com/econlab/econlab/discussions](https://github.com/econlab/econlab/discussions)
- **Email**: contributors@econlab.dev
