# craft-a-tester-typedapi

TypedAPI testing capabilities for Craft-a-Tester, enabling contract validation, request/response validation, and mock generation.

## Features

- TypedAPI contract validation
- Request type validation
- Response type validation
- Request validation against contracts
- Response validation against contracts
- Mock request generation
- Mock response generation
- TypeScript type generation from contracts
- Property and type checking

## Installation

This package is designed to work as part of the craftacoder monorepo using npm workspaces:

```bash
# From the root of the monorepo
npm install -w craft-a-tester-typedapi
```

Or install it directly:

```bash
npm install craft-a-tester-typedapi
```

## Usage

### Basic Usage

```typescript
import { TypedAPIAdapter, TypedAPIAddon } from 'craft-a-tester-typedapi';

// Create and initialize the TypedAPI adapter
const adapter = new TypedAPIAdapter({
  contractsBasePath: './contracts',
  validation: {
    strictMode: true
  }
});

await adapter.initialize();

// Validate a contract
const result = await adapter.validateContract('user.get.contracts.ts');
console.log(result);
```

### Integration with Craft-a-Tester

```typescript
import { TestExecutor, CapabilityRegistry } from 'craft-a-tester';
import { TypedAPIAddon } from 'craft-a-tester-typedapi';

// Create and initialize the test executor
const executor = new TestExecutor();

// Create the registry
const registry = new CapabilityRegistry();

// Create and register the TypedAPI addon
const typedAPIAddon = new TypedAPIAddon({
  contractsBasePath: './contracts'
});
typedAPIAddon.register(registry);

// Execute tests using the registry
const results = await executor.executeTests('tests/contract-tests.md', {
  registry
});
```

### Using with LLM-based Testing

The TypedAPI addon can be used with Craft-a-Tester's LLM-based testing capabilities:

```typescript
import { TestExecutor, CapabilityRegistry, OllamaAdapter } from 'craft-a-tester';
import { TypedAPIAddon } from 'craft-a-tester-typedapi';

// Create and initialize the test executor
const executor = new TestExecutor();

// Create the registry
const registry = new CapabilityRegistry();

// Set up LLM adapter
const llmAdapter = new OllamaAdapter({
  baseUrl: 'http://localhost:11434',
  model: 'llama3:8b',
  contextSize: 8192
});
await llmAdapter.initialize();
registry.setLLMAdapter(llmAdapter);

// Register the TypedAPI addon
const typedAPIAddon = new TypedAPIAddon({
  contractsBasePath: './contracts'
});
typedAPIAddon.register(registry);

// Execute tests with LLM-based capability resolution
const results = await executor.executeTests('tests/contract-tests.md', {
  registry
});
```

## Configuration Options

The TypedAPIAdapter supports the following configuration options:

```typescript
{
  // Base path for contract files
  contractsBasePath?: string;
  
  // Validation options
  validation?: {
    // Whether to use strict mode for validation
    strictMode?: boolean;
    
    // Whether to allow extra properties in requests/responses
    allowExtraProperties?: boolean;
    
    // Whether to validate types
    validateTypes?: boolean;
    
    // Whether to validate path parameters
    validatePaths?: boolean;
  };
  
  // Mock data generation options
  mock?: {
    // Whether to generate realistic data for mocks
    generateRealisticData?: boolean;
    
    // Locale for generated data
    locale?: string;
    
    // Seed for consistent mock generation
    seed?: number;
    
    // Custom generators for specific field types
    customGenerators?: Record<string, () => any>;
  };
}
```

## Using the CLI

You can use the craft-a-tester CLI to run TypedAPI tests:

```bash
# Configuration file (craft-a-tester.json)
{
  "llm": {
    "provider": "ollama",
    "baseUrl": "http://localhost:11434",
    "model": "phi4:14b-fp16",
    "contextSize": 16384,
    "dynamicContextSizing": true
  }
}

# Run tests with the CLI
craft-a-tester run-all tests/stories --recursive --config craft-a-tester.json
```

## Running the Examples

The package includes several examples:

```bash
# Run the integration example
npm run run:example

# Test contract validation
npm run test:contract

# Test TypeScript integration
npm run test:typescript

# Run tests with CLI
npm run test:cli
```

## Testing in the Monorepo

When working in the monorepo, use the workspace commands:

```bash
# Build all packages (from monorepo root)
npm run build:all

# Run TypedAPI tests (from monorepo root)
npm run test:typedapi

# Run the integration example
npm run run:example -w craft-a-tester-typedapi

# Test with Ollama
npm run test:ollama -w craft-a-tester-typedapi

# Run tests with CLI
npm run test:cli -w craft-a-tester-typedapi
```

## License

MIT