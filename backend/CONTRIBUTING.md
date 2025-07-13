# Contributing to HashCrack Backend

Thank you for your interest in contributing! This backend is built with FastAPI and is designed to be modular, readable, and easy to extend.

## How to Contribute

- **Open Issues**: Report bugs, suggest features, or ask questions via GitHub Issues.
- **Pull Requests**: Fork the repo, create a feature branch, and submit a PR.
- **Code Style**: Use [Black](https://black.readthedocs.io/en/stable/) for formatting and [isort](https://pycqa.github.io/isort/) for imports.
- **Type Hints**: Use Python type hints for all functions and models.
- **Tests**: Add tests for new features (pytest recommended).
- **Docs**: Update or add docstrings and API docs as needed.

## Development Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

## Running the Server

```bash
uvicorn main:app --reload
```

## Project Structure

- `main.py` — FastAPI app entry point
- `team_api.py` — Team management endpoints
- `requirements.txt` — Python dependencies
- `.env.example` — Example environment variables

## Code Quality

- Use clear, descriptive variable and function names
- Add docstrings to all public functions/classes
- Keep endpoints RESTful and modular

---
MIT License
