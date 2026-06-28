# Changelog

All notable changes to EconomicsLab will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-06-28

### Added
- Initial public release of EconomicsLab.
- **Package core**: `econlab` package structure with version management.
- **Built-in datasets** (`econlab.datasets`):
  - `load_nlsy()` -- National Longitudinal Survey of Youth (mock panel data).
  - `load_angrist_krueger()` -- Angrist & Krueger (1991) returns to education data.
  - `load_card_minwage()` -- Card & Krueger (1994) / Card (1995) minimum wage data.
  - `list_datasets()` and `get_dataset_info()` helper functions.
- **Web dashboard** (`econlab.webapp`):
  - Interactive dark-themed economics computing dashboard.
  - Model selection: OLS, IV/2SLS, Difference-in-Differences, Panel Fixed Effects, Logit/Probit.
  - Live Plotly.js charts with parameter input forms.
  - Results table with coefficient estimates and statistics.
  - Fully client-side, zero-dependency beyond Plotly.js CDN.
- **Jupyter tutorial** (`econlab/notebooks/tutorial.ipynb`):
  - 9 comprehensive sections covering OLS, IV, DiD, Panel, Logit, RD, LASSO, Bootstrap.
  - Clear markdown explanations with original paper references.
  - Working code examples and visualizations.
- **Documentation** (`docs/`):
  - `api.md` -- Full API reference for all modules and functions.
  - `user-guide.md` -- Step-by-step user guide with installation, usage, and FAQ.
- **Project infrastructure**:
  - `setup.py` with full packaging metadata and extras.
  - `requirements.txt` with pinned dependencies.
  - `README.md` with badges, TOC, architecture diagram, and citation info.
  - `CONTRIBUTING.md` with development guidelines.
  - `LICENSE` (MIT).
  - `.gitignore` for Python projects.

### Planned for 0.2.0
- Real NLSY data loader with secure access.
- Instrumental variable diagnostics (weak instrument tests, overidentification).
- Difference-in-Differences with staggered adoption (Callaway & Sant'Anna 2021).
- Regression discontinuity design module.
- Causal forest support via `econml`.
- Export results to LaTeX tables.
- CLI interface for quick model fitting.

### Planned for 0.3.0
- Synthetic control method.
- Event study plots.
- Structural equation modeling.
- Bayesian econometrics with PyMC.
- Docker image for reproducible research.
- Cloud deployment of web dashboard.
