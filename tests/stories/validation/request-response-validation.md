# Request and Response Validation Tests

This test verifies that the TypedAPIAdapter correctly validates requests and responses against contracts.

## Scenario: Request Validation

In this scenario, we'll test validating requests against TypedAPI contracts.

### Steps

1. Create and initialize a TypedAPIAdapter
2. Load a contract with path and query parameters
3. Create a valid request matching the contract
4. Validate the request against the contract
5. Verify that validation passes for the valid request
6. Create an invalid request (wrong parameter types)
7. Validate the invalid request
8. Verify that validation fails with proper error messages

### Expected Results

- Valid requests should pass validation
- The adapter should correctly handle path parameter validation
- The adapter should correctly parse and transform query parameters
- Invalid requests should fail validation with detailed errors

## Scenario: Response Validation

In this scenario, we'll test validating responses against TypedAPI contracts.

### Steps

1. Create and initialize a TypedAPIAdapter
2. Load a contract with multiple response status codes
3. Create a valid response for a 200 status code
4. Validate the response against the contract
5. Verify that validation passes for the valid response
6. Create a response for a different status code
7. Validate it against the contract
8. Create an invalid response (missing required fields)
9. Verify that validation fails with appropriate errors

### Expected Results

- Valid responses should pass validation
- The adapter should validate responses against the correct status code schema
- The adapter should handle different response status codes correctly
- Invalid responses should fail validation with detailed error messages