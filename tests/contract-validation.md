# TypedAPI Contract Validation Tests

This file contains test scenarios for validating TypedAPI contracts using the craft-a-tester-typedapi addon.

## Scenario: Validating a TypedAPI contract structure

The TypedAPI adapter can validate that a contract follows the correct structure and has all required fields.

### Given
I have a TypedAPI contract file `admin.api-key.get.contracts.ts`

### When
I validate the contract

### Then
The contract validation should succeed
And the contract should have method "get"
And the contract should have path "/admin/api-keys"
And the contract should require authentication
And the contract should define response status 200

## Scenario: Validating request types in a contract

The TypedAPI adapter can validate that a contract's request type is properly defined.

### Given
I have a TypedAPI contract file `admin.api-key.get.contracts.ts`

### When
I validate the request type

### Then
The request type validation should succeed
And the contract should have a query schema

## Scenario: Validating response types in a contract

The TypedAPI adapter can validate that a contract's response type is properly defined.

### Given
I have a TypedAPI contract file `admin.api-key.get.contracts.ts`

### When
I validate the response type

### Then
The response type validation should succeed
And the contract should have a response status code 200

## Scenario: Validating a request against a contract

The TypedAPI adapter can validate that a request object conforms to a contract's requirements.

### Given
I have a TypedAPI contract file `admin.api-key.get.contracts.ts`
And I have a request object with query parameters `status=active` and `companyId=12345`

### When
I validate the request against the contract

### Then
The request validation should succeed
And the query parameters should be valid

## Scenario: Generating a mock response from a contract

The TypedAPI adapter can generate mock data based on a contract's response schema.

### Given
I have a TypedAPI contract file `admin.api-key.get.contracts.ts`

### When
I generate a mock response

### Then
The mock response generation should succeed
And the mock response should be an array
And the mock response items should have the required API key fields