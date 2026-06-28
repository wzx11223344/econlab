# Contributing to EconomicsLab

Thank you for your interest in contributing to EconomicsLab! This document
provides guidelines to help you get started.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Environment](#development-environment)
4. [Branching Strategy](#branching-strategy)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Pull Request Process](#pull-request-process)
8. [Adding New Datasets](#adding-new-datasets)
9. [Adding New Econometric Models](#adding-new-econometric-models)
10. [Documentation](#documentation)
11. [Release Process](#release-process)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
By participating, you agree to uphold this code. Please report unacceptable
behavior to contributors@econlab.dev.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/econlab.git
   cd econlab
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/econlab/econlab.git
   ```

## Development Environment

```bash
# Create virtual environment
python -m venv venv
# Activate (Windows)
venv\Scripts\activate
# Activate (Unix/macOS)
source venv/bin/activate

# Install in editable mode with dev dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
```

## Branching Strategy

- `main` -- Stable release branch. Do not push directly.
- `develop` -- Integration branch for features.
- `feature/<name>` -- Feature branches (e.g., `feature/iv-diagnostics`).
- `fix/<name>` -- Bug fix branches (e.g., `fix/nlsy-date-parsing`).
- `docs/<name>` -- Documentation-only changes.

Branch names should be lowercase, use hyphens, and be descriptive.

## Coding Standards

We follow PEP 8 with a few additions:

- **Line length**: 88 characters (Black default).
- **Docstrings**: Google style for all public functions/methods.
- **Type hints**: Required for all public API functions.
- **Imports**: Use `isort` (profile: black). Standard library first, then
  third-party, then local.
- **Naming**:
  - `snake_case` for functions, variables, methods.
  - `PascalCase` for classes.
  - `UPPER_CASE` for constants.

Run formatting before committing:
```bash
black econlab/
isort econlab/
flake8 econlab/
mypy econlab/
```

## Testing

All new features must include tests. We use `pytest`.

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=econlab --cov-report=html

# Run specific test file
pytest tests/test_datasets.py
```

Test files are located in `tests/` and mirror the package structure.

## Pull Request Process

1. Ensure your branch is up to date with `upstream/develop`:
   ```bash
   git fetch upstream
   git rebase upstream/develop
   ```
2. Run all tests and linting. All checks must pass.
3. Update `CHANGELOG.md` under the `[Unreleased]` section.
4. Push your branch and open a PR against `develop`.
5. Fill out the PR template completely.
6. Request review from at least one maintainer.
7. Address all review comments.
8. Once approved, a maintainer will merge your PR.

### PR Template

```
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Code formatted (black, isort)
- [ ] Linting passes (flake8, mypy)
```

## Adding New Datasets

1. Create a new loader function in `econlab/datasets.py`.
2. Function signature:
   ```python
   def load_MY_DATASET(cache: bool = True) -> pd.DataFrame:
       """Load the MY_DATASET dataset.

       Parameters
       ----------
       cache : bool
           If True (default), cache the dataset in memory.

       Returns
       -------
       pd.DataFrame
           The dataset with proper dtypes and labels.

       References
       ----------
       Author (Year). "Title". Journal.
       """
   ```
3. Add the function to `__all__` in `econlab/__init__.py`.
4. Add the dataset to `DATASET_REGISTRY` in `datasets.py`.
5. Update `docs/api.md` with the new function documentation.
6. Add an example to `tutorial.ipynb` if applicable.
7. If using real data, ensure it is in the public domain or properly licensed.

## Adding New Econometric Models

1. Create a new module in `econlab/models/` (e.g., `econlab/models/rdd.py`).
2. Use standard sklearn-style API:
   - `fit(X, y)` for estimation.
   - `summary()` for results table.
   - `predict(X)` for predictions.
3. Add comprehensive docstrings and type hints.
4. Link to original paper(s) in the module docstring.
5. Add tests in `tests/models/`.

## Documentation

- **API docs**: Update `docs/api.md` when changing public interfaces.
- **User guide**: Update `docs/user-guide.md` for new workflows.
- **Docstrings**: Google-style with Parameters, Returns, Raises, References sections.
- **Examples**: Every public function should have at least one usage example.

## Release Process

1. Merge all feature PRs into `develop`.
2. Run full test suite and fix any issues.
3. Update version in `econlab/__init__.py`.
4. Update `CHANGELOG.md` -- move `[Unreleased]` to the new version section.
5. Create a PR from `develop` to `main`.
6. After merge, tag the release:
   ```bash
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push upstream v0.1.0
   ```
7. Build and publish to PyPI:
   ```bash
   python -m build
   python -m twine upload dist/*
   ```

---

## Questions?

Open a [GitHub Discussion](https://github.com/econlab/econlab/discussions) or
email contributors@econlab.dev. We are happy to help!
