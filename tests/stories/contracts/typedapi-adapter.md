# TypedAPI Adapter Tests

This test verifies the core functionality of the TypedAPIAdapter.

## Scenario: TypedAPIAdapter Initialization

In this scenario, we'll test initializing the TypedAPIAdapter with different configurations.

### Steps

1. Create a TypedAPIAdapter with default configuration
2. Initialize the adapter
3. Verify that the adapter is properly initialized
4. Create an adapter with custom validation settings
5. Initialize the adapter with custom settings
6. Verify that custom settings are applied correctly

### Expected Results

- The adapter should initialize successfully with default settings
- The adapter should recognize the contracts directory
- The adapter should apply custom validation settings when provided
- Initialization should fail gracefully if contracts directory doesn't exist

## Scenario: Contract Validation

In this scenario, we'll test validating TypedAPI contracts with the adapter.

### Steps

1. Create and initialize a TypedAPIAdapter
2. Load a valid contract
3. Validate the contract structure
4. Verify that validation passes for the valid contract
5. Modify the contract to be invalid
6. Validate the invalid contract
7. Verify that validation fails with appropriate errors

### Expected Results

- Valid contracts should pass validation
- Validation should check path, method, and schema fields
- Invalid contracts should fail validation with detailed error messages
- The adapter should provide warnings for potential issues