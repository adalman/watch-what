# Frontend Testing Guide

This document provides information about running and maintaining tests for the Watch What frontend application.

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode (Recommended for Development)
```bash
npm test -- --watch
```

### Run Tests with Coverage Report
```bash
npm test -- --coverage --watchAll=false
```

## Test Structure

```
src/
├── components/session/__tests__/
│   ├── SessionCreator.test.tsx    # Session creation form tests
│   └── SessionJoiner.test.tsx     # Session joining form tests
├── context/__tests__/
│   └── SessionContext.test.tsx    # Global state management tests
└── services/__tests__/
    └── api.test.ts                # API service layer tests
```

## Test Coverage

### Current Coverage (43 tests total)

| Component | Tests | Coverage | Status |
|-----------|-------|----------|--------|
| SessionContext | 9 | 96.87% | Complete |
| SessionCreator | 15 | 100% | Complete |
| SessionJoiner | 19 | 73.52% | Complete |
| API Service | 8 | 0% | Complete |

### What's Tested

**SessionContext Tests**
- Initial state validation
- Session creation/joining API integration
- Error handling and recovery
- Loading state management
- State clearing and updates
- Creator/participant role detection

**SessionCreator Tests**
- Form rendering and structure
- Input validation (empty, whitespace)
- Form submission (button and Enter key)
- Loading states and error handling
- Accessibility (labels, form structure)
- Button state management

**SessionJoiner Tests**
- Form rendering and structure
- Multi-field validation
- Session code and name validation
- Form submission handling
- Loading states and error handling
- Input clearing and retry functionality
- Accessibility compliance

**API Service Tests**
- Session creation/joining API calls
- Network error handling
- HTTP status error handling (400, 404, 500)
- Response data validation

## Running Specific Tests

### Individual Test Files
```bash
# SessionContext tests
npm test -- --testPathPattern="SessionContext.test.tsx" --watchAll=false

# SessionCreator tests
npm test -- --testPathPattern="SessionCreator.test.tsx" --watchAll=false

# SessionJoiner tests
npm test -- --testPathPattern="SessionJoiner.test.tsx" --watchAll=false

# API service tests
npm test -- --testPathPattern="api.test.ts" --watchAll=false
```

### Test Groups
```bash
# All session-related tests
npm test -- --testPathPattern="(SessionContext|SessionCreator|SessionJoiner).test.tsx" --watchAll=false

# All component tests
npm test -- --testPathPattern="components.*test.tsx" --watchAll=false

# All context tests
npm test -- --testPathPattern="context.*test.tsx" --watchAll=false
```

### Other Options
```bash
# Verbose output
npm test -- --verbose --watchAll=false

# CI mode with coverage
npm test -- --ci --coverage --watchAll=false
```

## Test Configuration

### Testing Libraries
- **@testing-library/react**: Component rendering and interaction
- **@testing-library/jest-dom**: Custom matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation
- **jest**: Test runner and mocking framework

### Jest Configuration
Tests use the default Create React App Jest configuration with:
- React Testing Library for component testing
- Jest for test runner and mocking
- Coverage reporting enabled
- TypeScript support

## Writing New Tests

### Test File Structure
```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionProvider } from '../../context/SessionContext';
import YourComponent from '../YourComponent';

// Mock dependencies
jest.mock('../../services/api');

describe('YourComponent', () => {
  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <SessionProvider>
        {component}
      </SessionProvider>
    );
  };

  describe('Initial Render', () => {
    it('should render correctly', () => {
      renderWithProvider(<YourComponent />);
      // Your assertions here
    });
  });

  describe('User Interactions', () => {
    it('should handle user input', async () => {
      renderWithProvider(<YourComponent />);
      // Test user interactions
    });
  });
});
```

### Best Practices
1. Test user behavior, not implementation details
2. Use semantic queries (getByRole, getByLabelText) over getByTestId
3. Test accessibility by ensuring proper labels and ARIA attributes
4. Mock external dependencies (API calls, third-party libraries)
5. Test error scenarios and edge cases
6. Use descriptive test names that explain expected behavior
7. Group related tests using describe blocks

### Common Patterns

**Testing Form Submissions**
```typescript
it('should submit form with valid data', async () => {
  renderWithProvider(<YourForm />);
  
  const input = screen.getByLabelText(/your label/i);
  const submitButton = screen.getByRole('button', { name: /submit/i });
  
  await userEvent.type(input, 'test value');
  await userEvent.click(submitButton);
  
  await waitFor(() => {
    expect(mockApiCall).toHaveBeenCalledWith('test value');
  });
});
```

**Testing Error Handling**
```typescript
it('should handle API errors gracefully', async () => {
  mockApiCall.mockRejectedValue(new Error('API Error'));
  
  renderWithProvider(<YourComponent />);
  await userEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

**Testing Loading States**
```typescript
it('should show loading state during API call', async () => {
  renderWithProvider(<YourComponent />);
  
  const button = screen.getByRole('button');
  await userEvent.click(button);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(button).toBeDisabled();
});
```

## Debugging Tests

### Common Issues

**Test Hangs or Times Out**
- Check for unhandled promises or async operations
- Ensure all mocks are properly configured
- Use `waitFor` for asynchronous assertions

**Element Not Found**
- Verify the element exists in the rendered component
- Check for typos in text content or labels
- Use `screen.debug()` to inspect the rendered DOM

**Mock Not Working**
- Ensure mocks are defined before rendering
- Check mock function names match exactly
- Verify mock implementation returns expected values

### Debugging Commands
```bash
# Run single test file with verbose output
npm test -- --testPathPattern="YourTest.test.tsx" --verbose --watchAll=false

# Run specific test by name
npm test -- --testNamePattern="should handle user input" --watchAll=false

# Debug with console output
npm test -- --verbose --no-coverage --watchAll=false
```

## Coverage Goals

### Current Coverage Targets
- Components: 80%+ statement coverage
- Context: 90%+ statement coverage  
- Services: 85%+ statement coverage
- Overall: 80%+ statement coverage

### Improving Coverage
1. Identify uncovered lines using coverage reports
2. Add tests for edge cases and error scenarios
3. Test conditional logic and branching
4. Mock external dependencies properly
5. Test user interactions thoroughly

## Continuous Integration

### GitHub Actions Integration
Tests are automatically run on:
- Pull requests
- Push to main branch
- Manual workflow triggers

### Pre-commit Hooks
Consider adding pre-commit hooks to:
- Run tests before commits
- Check coverage thresholds
- Lint test files

## Additional Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [Accessibility Testing Guide](https://testing-library.com/docs/dom-testing-library/api-accessibility)

## Contributing to Tests

When adding new features:
1. Write tests first (TDD approach)
2. Update this documentation if needed
3. Ensure all tests pass before submitting PR
4. Add integration tests for complex user flows
5. Test accessibility for new UI components

---

**Last Updated**: December 2024  
**Test Framework**: Jest + React Testing Library  
**Coverage Tool**: Jest Coverage 