import { TypedAPIAdapter } from '../src';
import * as path from 'path';

/**
 * Example of directly using the TypedAPI adapter without the full craft-a-tester framework
 */
async function testContract() {
  console.log('----- Testing TypedAPI Contract Directly -----');
  
  // Create the TypedAPI adapter
  const adapter = new TypedAPIAdapter({
    contractsBasePath: path.join(__dirname, '..', '..', 'shared', 'contracts'),
    validation: {
      strictMode: true
    }
  });
  
  try {
    // Initialize the adapter
    await adapter.initialize();
    
    // Path to a sample contract to test
    const contractPath = 'admin.api-key.get.contracts.ts';
    
    console.log(`\nValidating contract: ${contractPath}`);
    
    // Validate the contract
    const validationResult = await adapter.validateContract(contractPath);
    
    if (validationResult.success) {
      console.log('✅ Contract validation passed!');
      console.log('Details:', JSON.stringify(validationResult.details, null, 2));
    } else {
      console.log('❌ Contract validation failed!');
      console.log('Errors:', validationResult.errors);
      if (validationResult.warnings) {
        console.log('Warnings:', validationResult.warnings);
      }
    }
    
    // Validate the request type
    console.log('\nValidating request type...');
    const requestValidation = await adapter.validateRequestType(contractPath);
    
    if (requestValidation.success) {
      console.log('✅ Request type validation passed!');
      console.log('Details:', JSON.stringify(requestValidation.details, null, 2));
      if (requestValidation.warnings) {
        console.log('Warnings:', requestValidation.warnings);
      }
    } else {
      console.log('❌ Request type validation failed!');
      console.log('Errors:', requestValidation.errors);
      if (requestValidation.warnings) {
        console.log('Warnings:', requestValidation.warnings);
      }
    }
    
    // Validate the response type
    console.log('\nValidating response type...');
    const responseValidation = await adapter.validateResponseType(contractPath);
    
    if (responseValidation.success) {
      console.log('✅ Response type validation passed!');
      console.log('Details:', JSON.stringify(responseValidation.details, null, 2));
      if (responseValidation.warnings) {
        console.log('Warnings:', responseValidation.warnings);
      }
    } else {
      console.log('❌ Response type validation failed!');
      console.log('Errors:', responseValidation.errors);
      if (responseValidation.warnings) {
        console.log('Warnings:', responseValidation.warnings);
      }
    }
    
    // Test request validation
    console.log('\nValidating request against contract...');
    const requestValidationResult = await adapter.validateRequestAgainstContract(
      contractPath,
      {
        query: {
          status: 'active',
          companyId: '12345'
        }
      }
    );
    
    if (requestValidationResult.success) {
      console.log('✅ Request validation passed!');
      console.log('Details:', JSON.stringify(requestValidationResult.details, null, 2));
      if (requestValidationResult.warnings) {
        console.log('Warnings:', requestValidationResult.warnings);
      }
    } else {
      console.log('❌ Request validation failed!');
      console.log('Errors:', requestValidationResult.errors);
      if (requestValidationResult.warnings) {
        console.log('Warnings:', requestValidationResult.warnings);
      }
    }
    
    // Test response validation
    console.log('\nValidating response against contract...');
    const responseValidationResult = await adapter.validateResponseAgainstContract(
      contractPath,
      [
        {
          id: '123',
          name: 'Test API Key',
          uniqueIdentifier: 'test-key',
          company: 'company-123',
          user: 'user-123',
          keyHash: 'hash-123',
          truncatedKey: 'abc...xyz',
          status: 'active',
          permissions: ['read', 'write'],
          usageCount: 42,
          createdAt: new Date().toISOString()
        }
      ],
      200
    );
    
    if (responseValidationResult.success) {
      console.log('✅ Response validation passed!');
      console.log('Details:', JSON.stringify(responseValidationResult.details, null, 2));
      if (responseValidationResult.warnings) {
        console.log('Warnings:', responseValidationResult.warnings);
      }
    } else {
      console.log('❌ Response validation failed!');
      console.log('Errors:', responseValidationResult.errors);
      if (responseValidationResult.warnings) {
        console.log('Warnings:', responseValidationResult.warnings);
      }
    }
    
    // Generate mock data
    console.log('\nGenerating mock response...');
    const mockResponse = await adapter.generateMockResponse(contractPath);
    
    if (mockResponse.success) {
      console.log('✅ Mock response generated successfully!');
      console.log('Mock data:', JSON.stringify(mockResponse.data, null, 2));
    } else {
      console.log('❌ Failed to generate mock response!');
    }
  } catch (error) {
    console.error('Error testing contract:', error);
  } finally {
    // Cleanup
    await adapter.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testContract().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default testContract;