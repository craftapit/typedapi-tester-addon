import { TypedAPIAdapter, TypedAPIAdapterConfig } from './TypedAPIAdapter';
import { AddonCapability, Addon, CapabilityRegistry } from '@craftapit/tester';

/**
 * TypedAPI Addon for Craft-a-Tester
 */
export class TypedAPIAddon implements Addon {
  /**
   * Addon name
   */
  public readonly name = '@craftapit/typedapi-tester-addon';
  
  /**
   * Addon version
   */
  public readonly version = '1.0.0';
  
  /**
   * Addon description
   */
  public readonly description = 'TypedAPI testing capabilities for Craft-a-Tester';
  
  /**
   * The TypedAPI adapter instance
   */
  private adapter: TypedAPIAdapter;
  
  /**
   * Capabilities provided by this addon
   */
  private capabilities: AddonCapability[] = [];
  
  constructor(config: TypedAPIAdapterConfig = {}) {
    this.adapter = new TypedAPIAdapter(config);
    this.initializeCapabilities();
  }
  
  /**
   * Initialize the capabilities provided by this addon
   */
  private initializeCapabilities(): void {
    // Contract Validation Capabilities
    this.capabilities.push({
      name: 'validateContract',
      descriptions: [
        'Validates a TypedAPI contract against its schema',
        'Checks if a contract definition is valid',
        'Validates the structure and types in a contract'
      ],
      examples: [
        'When I validate the user contract',
        'Then the API contract should be valid',
        'Given a valid TypedAPI contract'
      ],
      handler: async (contractPath: string) => {
        return this.adapter.validateContract(contractPath);
      }
    });
    
    this.capabilities.push({
      name: 'validateRequestType',
      descriptions: [
        'Validates the request type in a TypedAPI contract',
        'Checks that a request type definition is valid',
        'Ensures request type matches path parameters'
      ],
      examples: [
        'When I validate the request type',
        'Then the request type should be valid',
        'Then all path parameters should be in the request type'
      ],
      handler: async (contractPath: string) => {
        return this.adapter.validateRequestType(contractPath);
      }
    });
    
    this.capabilities.push({
      name: 'validateResponseType',
      descriptions: [
        'Validates the response type in a TypedAPI contract',
        'Checks that a response type definition is valid',
        'Ensures response type includes all required fields'
      ],
      examples: [
        'When I validate the response type',
        'Then the response type should be valid',
        'Then the response type should include all required fields'
      ],
      handler: async (contractPath: string) => {
        return this.adapter.validateResponseType(contractPath);
      }
    });
    
    // Request/Response Testing Capabilities
    this.capabilities.push({
      name: 'createMockRequest',
      descriptions: [
        'Creates a mock request based on a TypedAPI contract',
        'Generates a sample request that conforms to the contract',
        'Creates test data for API requests'
      ],
      examples: [
        'When I create a mock request',
        'Given I have a sample request',
        'When I generate test data for the request'
      ],
      handler: async (contractPath: string) => {
        return this.adapter.createMockRequest(contractPath);
      }
    });
    
    this.capabilities.push({
      name: 'validateRequestAgainstContract',
      descriptions: [
        'Validates a request against a TypedAPI contract',
        'Checks if a request object conforms to its contract',
        'Verifies request data is valid according to the schema'
      ],
      examples: [
        'When I validate the request against the contract',
        'Then the request should be valid',
        'When I check if the request matches the schema'
      ],
      handler: async (contractPath: string, request: any) => {
        return this.adapter.validateRequestAgainstContract(contractPath, request);
      }
    });
    
    this.capabilities.push({
      name: 'validateResponseAgainstContract',
      descriptions: [
        'Validates a response against a TypedAPI contract',
        'Checks if a response object conforms to its contract',
        'Verifies response data is valid according to the schema'
      ],
      examples: [
        'When I validate the response against the contract',
        'Then the response should be valid',
        'When I check if the response matches the schema'
      ],
      handler: async (contractPath: string, response: any) => {
        return this.adapter.validateResponseAgainstContract(contractPath, response);
      }
    });
    
    // Type Checking Capabilities
    this.capabilities.push({
      name: 'generateTypes',
      descriptions: [
        'Generates TypeScript types from a TypedAPI contract',
        'Creates type definitions based on a contract',
        'Extracts types from a contract file'
      ],
      examples: [
        'When I generate types for the contract',
        'Then I should get valid TypeScript types',
        'When I extract type definitions from the contract'
      ],
      handler: async (contractPath: string) => {
        return this.adapter.generateTypes(contractPath);
      }
    });
    
    this.capabilities.push({
      name: 'checkTypeExistence',
      descriptions: [
        'Checks if a type exists in a TypedAPI contract',
        'Verifies that a specific type is defined',
        'Tests for the presence of a type definition'
      ],
      examples: [
        'Then the contract should have a type named "UserRequest"',
        'When I check if the type exists',
        'Then the type should be defined in the contract'
      ],
      handler: async (contractPath: string, typeName: string) => {
        return this.adapter.checkTypeExistence(contractPath, typeName);
      }
    });
    
    this.capabilities.push({
      name: 'checkTypeProperty',
      descriptions: [
        'Checks if a property exists on a type in a TypedAPI contract',
        'Verifies that a type has a specific property',
        'Tests for the presence of a field in a type'
      ],
      examples: [
        'Then the UserRequest type should have a "username" property',
        'When I check if the property exists on the type',
        'Then the type should have the required field'
      ],
      handler: async (contractPath: string, typeName: string, propertyName: string) => {
        return this.adapter.checkTypeProperty(contractPath, typeName, propertyName);
      }
    });
    
    this.capabilities.push({
      name: 'generateMockResponse',
      descriptions: [
        'Generates a mock response based on a TypedAPI contract',
        'Creates sample response data that conforms to the contract',
        'Generates test data for API responses'
      ],
      examples: [
        'When I generate a mock response',
        'Given I have a sample response',
        'When I create test data for the response'
      ],
      handler: async (contractPath: string) => {
        return this.adapter.generateMockResponse(contractPath);
      }
    });
  }
  
  /**
   * Register this addon with the capability registry
   * @param registry The capability registry to register with
   */
  register(registry: CapabilityRegistry): void {
    // Register the adapter
    registry.registerAdapter('typedapi', this.adapter);
    
    // Register all capabilities
    for (const capability of this.capabilities) {
      registry.registerCapability(capability);
    }
    
    console.log(`Registered TypedAPI addon with ${this.capabilities.length} capabilities`);
  }
  
  /**
   * Register capabilities with the registry (used by TestRunner)
   * @param registry The capability registry to register with
   */
  registerCapabilities(registry: CapabilityRegistry): void {
    this.register(registry);
  }
  
  /**
   * Get the TypedAPI adapter instance
   */
  getAdapter(): TypedAPIAdapter {
    return this.adapter;
  }
  
  /**
   * Get adapter by explicit accessor method for backward compatibility
   */
  getTypedAPIAdapter(): TypedAPIAdapter {
    return this.adapter;
  }
  
  /**
   * Get all capabilities provided by this addon
   */
  getCapabilities(): AddonCapability[] {
    return [...this.capabilities];
  }
}