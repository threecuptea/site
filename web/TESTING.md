# Testing Quick Guide

This project uses **Vitest** for unit tests.

## Run all tests

```bash
npm run test
```

## Run a specific test file

```bash
npx vitest run lib/digitalTwinRetrieval.test.ts
```

You can also run:

```bash
npx vitest run lib/chatTextUtils.test.ts
```

## Run a specific test case (by name)

Use `-t` (or `--testNamePattern`) to match part of the test title:

```bash
npx vitest run lib/digitalTwinRetrieval.test.ts -t "pickBestProjectEntry"
```

Another example:

```bash
npx vitest run -t "converts <br> variants into newline breaks"
```

## Optional: watch mode during development

```bash
npx vitest
```

## Expected success output (example)

```text
Test Files  2 passed (2)
Tests       6 passed (6)
```

If a test fails, Vitest prints the failing file, test name, and assertion diff.
