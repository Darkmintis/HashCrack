# Contributing to HashCrack

Thank you for your interest in contributing to HashCrack! This document provides guidelines and information for contributors.

## Ways to Contribute

### Bug Reports
- Search existing issues first
- Use the bug report template
- Include system information
- Provide steps to reproduce

### Feature Requests
- Check existing feature requests
- Use the feature request template
- Explain the use case
- Consider implementation details

### Code Contributions
- Fork the repository
- Create a feature branch
- Follow coding standards
- Add tests for new features
- Update documentation

### Documentation
- Fix typos and errors
- Add examples and tutorials
- Improve API documentation
- Translate to other languages

## Development Setup

### Prerequisites
- Python 3.8+
- Git
- Virtual environment tool

### Setup Process
```bash
# Fork and clone the repository
git clone https://github.com/YourUsername/HashCrack.git
cd HashCrack

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Install development dependencies
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Run tests to ensure everything works
python -m pytest tests/
```

## Coding Standards

### Python Style
- Follow PEP 8
- Use type hints
- Maximum line length: 88 characters
- Use Black for formatting
- Use isort for import sorting

### Code Quality
- Minimum test coverage: 80%
- All functions must have docstrings
- Use meaningful variable names
- Handle exceptions appropriately

### Example Code Style
```python
def crack_hash(hash_value: str, wordlist: str, engine: str = "auto") -> Dict[str, Any]:
    """
    Crack a password hash using specified engine and wordlist.
    
    Args:
        hash_value: The hash to crack
        wordlist: Path to wordlist file
        engine: Cracking engine to use ('john', 'hashcat', 'auto')
    
    Returns:
        Dictionary containing cracking results
        
    Raises:
        ValueError: If hash_value is invalid
        FileNotFoundError: If wordlist doesn't exist
    """
    if not hash_value or not isinstance(hash_value, str):
        raise ValueError("Invalid hash value")
    
    # Implementation here
    pass
```

## Testing

### Running Tests
```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=hashcrack

# Run specific test file
python -m pytest tests/test_hash_engine.py

# Run tests in parallel
python -m pytest -n auto
```

### Writing Tests
- Use pytest framework
- Test both success and failure cases
- Mock external dependencies
- Use descriptive test names

### Test Structure
```python
def test_hash_identification_md5():
    """Test MD5 hash identification accuracy."""
    hash_value = "5d41402abc4b2a76b9719d911017c592"
    result = identify_hash(hash_value)
    
    assert result.hash_type == "MD5"
    assert result.confidence > 0.9
    assert "raw-md5" in result.john_formats
```

## Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Build process or auxiliary tool changes

### Examples
```
feat(engine): add hashcat GPU acceleration support

fix(wordlist): handle download timeout gracefully

docs(readme): update installation instructions

test(hash): add tests for new hash formats
```

## 🔄 Pull Request Process

### Before Submitting
1. Ensure all tests pass
2. Update documentation if needed
3. Add tests for new features
4. Run linting and formatting tools
5. Rebase on latest main branch

### PR Template
Use the provided pull request template and fill out all sections:
- Description of changes
- Type of change
- Testing performed
- Checklist completion

### Review Process
1. Automated checks must pass
2. Code review by maintainers
3. Testing on different platforms
4. Documentation review
5. Final approval and merge

## 🏗 Project Structure

```
HashCrack/
├── hashcrack/              # Main package
│   ├── __init__.py
│   ├── engine/             # Cracking engines
│   ├── wordlists/          # Wordlist management
│   ├── progress/           # Progress tracking
│   └── web/                # Web interface
├── tests/                  # Test suite
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── requirements.txt        # Production dependencies
├── requirements-dev.txt    # Development dependencies
└── setup.py               # Installation script
```

## 🎯 Hash Format Contributions

### Adding New Hash Formats

1. **Research the format**
   - Understand the algorithm
   - Find test vectors
   - Check existing support in John/Hashcat

2. **Implement detection**
   ```python
   def detect_custom_hash(hash_value: str) -> HashInfo:
       """Detect custom hash format."""
       if len(hash_value) == 32 and hash_value.startswith("custom"):
           return HashInfo(
               hash_type="CustomHash",
               confidence=0.8,
               john_format="custom",
               hashcat_mode=99999
           )
   ```

3. **Add test cases**
   ```python
   def test_custom_hash_detection():
       hash_val = "custom1234567890abcdef1234567890ab"
       result = detect_hash(hash_val)
       assert result.hash_type == "CustomHash"
   ```

4. **Update documentation**
   - Add to supported formats list
   - Include example usage
   - Document any special requirements

## 🌍 Localization

### Adding Translations
1. Create language file in `locales/`
2. Translate all user-facing strings
3. Test with different locales
4. Update language selection in UI

### Translation Guidelines
- Keep technical terms in English
- Maintain consistent terminology
- Consider cultural context
- Test UI layout with longer text

## 🔒 Security Considerations

### Security Best Practices
- Never commit sensitive data
- Validate all user inputs
- Use secure defaults
- Follow OWASP guidelines
- Regular dependency updates

### Reporting Security Issues
- Do not create public issues for security vulnerabilities
- Email security@darkmintis.com
- Include detailed information
- Allow time for patch development

## 🏆 Recognition

### Contributors
All contributors are recognized in:
- CONTRIBUTORS.md file
- GitHub contributors page
- Release notes
- Project documentation

### Special Recognition
- First-time contributors
- Major feature contributors
- Bug hunters
- Documentation improvements
- Long-term maintainers

## 📞 Getting Help

### Communication Channels
- GitHub Issues: Bug reports and feature requests
- GitHub Discussions: General questions and ideas
- Discord: Real-time chat (coming soon)
- Email: hashcrack@darkmintis.com

### Mentorship
New contributors can request mentorship for:
- Understanding the codebase
- Best practices guidance
- Code review process
- Open source contribution

## 📅 Release Process

### Versioning
HashCrack follows Semantic Versioning (SemVer):
- MAJOR: Breaking changes
- MINOR: New features, backward compatible
- PATCH: Bug fixes, backward compatible

### Release Schedule
- Major releases: Every 6 months
- Minor releases: Monthly
- Patch releases: As needed

Thank you for contributing to HashCrack! Together, we're building the best hash cracking tool for the cybersecurity community. 🚀
