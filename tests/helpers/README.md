# Test Helpers

This directory contains utility files and helpers for use in tests that should be excluded from code coverage metrics.

## Contents

- `context.test.ts` - Provides a test-friendly implementation of the app context.

## Usage

### Context Helpers

See [Mocking the Context](https://bloomberg.github.io/stricli/docs/testing#mocking-the-context).

Import the context helper function from this directory when writing tests:

```typescript
import { buildContextForTest } from "../helpers/context.test";
```

Use it to build a context for testing:

```typescript
const context = buildContextForTest();
```

You can also set up the context with custom values:

```typescript
const context = buildContextForTest({
  user: { id: 123, email: "test@example.com" },
});
```

Then use it in tests:

```typescript
await sut.call(context);
```

#### Full example

```typescript
import { buildContextForTest } from "../helpers/context.test";
import { module as sut } from "../path/to/module";

describe("My Test Suite", () => {
  it("should do something", async () => {
    const context = buildContextForTest({
      user: { id: 123, email: "test@example.com" },
    });

    await sut.call(context);

    expect(context.user.id).toBe(123);
  });
});
```
