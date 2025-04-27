import { TypedAPIAdapter, TypedAPIAddon } from '../src';
import { 
  OllamaAdapter, 
  LLMAdapter, 
  CapabilityRegistry,
  ResolutionQuality
} from '@craftapit/tester';
import path from 'path';

/**
 * Integration example showing the TypedAPI adapter working with Ollama LLM
 */
async function runIntegrationTest() {
  console.log("\n========== TypedAPI + Ollama Integration Test ==========\n");

  try {
    // Create and initialize the capability registry
    const registry = new CapabilityRegistry();
    console.log("Created capability registry");

    // Create and initialize the Ollama adapter (using a small model for testing)
    const ollamaAdapter = new OllamaAdapter({
      baseUrl: 'http://localhost:11434',
      model: 'gemma:2b', // Using a small model for quick testing
      contextSize: 4096,
      dynamicContextSizing: true
    });
    console.log("Created Ollama adapter with gemma:2b model");

    // Initialize Ollama
    try {
      await ollamaAdapter.initialize();
      console.log("Ollama adapter initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Ollama adapter:", error);
      console.log("Continuing without LLM integration...");
    }

    // Register Ollama adapter with the registry for capability resolution
    registry.setLLMAdapter(ollamaAdapter as unknown as LLMAdapter);

    // Create and initialize the TypedAPI addon
    const typedAPIAddon = new TypedAPIAddon({
      contractsBasePath: path.resolve(__dirname, '../../shared/contracts'),
      validation: {
        strictMode: true,
        validateTypes: true
      }
    });
    console.log("Created TypedAPI addon");

    // Register the TypedAPI addon with the registry
    typedAPIAddon.register(registry);
    console.log("Registered TypedAPI addon with registry");

    // Get the TypedAPI adapter
    const typedAPIAdapter = typedAPIAddon.getTypedAPIAdapter();
    
    // Initialize the adapter
    await typedAPIAdapter.initialize();
    console.log("TypedAPI adapter initialized");

    // Log the registered capabilities
    const capabilities = registry.getAllCapabilities();
    console.log(`Registered ${capabilities.length} capabilities:`);
    capabilities.forEach(capability => {
      console.log(`- ${capability.name}: ${capability.descriptions[0]}`);
    });

    // Test file paths
    const contractPath = 'admin.api-key.get.contracts.ts';
    console.log(`\nTest contract: ${contractPath}`);

    // Step 1: Try to resolve capability using LLM
    console.log("\n----- LLM Capability Resolution Test -----");
    
    try {
      const naturalLanguageQuery = "Check if the admin API key contract is valid";
      console.log(`Natural language query: "${naturalLanguageQuery}"`);

      const resolution = await registry.findCapabilityForAction(naturalLanguageQuery);
      
      if (resolution) {
        const { capability, parameters, confidence } = resolution;
        console.log(`✅ Found capability: ${capability.name}`);
        console.log(`Parameters: ${JSON.stringify(parameters)}`);
        console.log(`Confidence: ${confidence.toFixed(2)}`);
        
        // Execute the resolved capability
        console.log("\nExecuting resolved capability...");
        const resolvedParameters = parameters.length > 0 ? parameters : [contractPath];
        const result = await registry.executeCapability(capability.name, resolvedParameters);
        
        console.log("Execution result:");
        console.log(JSON.stringify(result, null, 2));
        
        // Provide feedback
        await registry.provideFeedback({
          stepId: "test-step-1",
          quality: ResolutionQuality.GOOD,
          source: "system",
          timestamp: Date.now()
        });
      } else {
        console.log("❌ Failed to resolve capability from natural language");
        console.log("Continuing with direct API calls...");
      }
    } catch (error) {
      console.error("Error in capability resolution:", error);
      console.log("Continuing with direct API calls...");
    }

    // Step 2: Direct API Testing
    console.log("\n----- Direct API Testing -----");
    
    // Validate the contract
    console.log("\nValidating contract directly...");
    const validationResult = await typedAPIAdapter.validateContract(contractPath);
    
    if (validationResult.success) {
      console.log("✅ Contract validation passed!");
      console.log("Details:", JSON.stringify(validationResult.details, null, 2));
    } else {
      console.log("❌ Contract validation failed!");
      console.log("Errors:", validationResult.errors);
    }

    // Validate request type
    console.log("\nValidating request type...");
    const requestTypeResult = await typedAPIAdapter.validateRequestType(contractPath);
    
    if (requestTypeResult.success) {
      console.log("✅ Request type validation passed!");
      console.log("Details:", JSON.stringify(requestTypeResult.details, null, 2));
    } else {
      console.log("❌ Request type validation failed!");
      console.log("Errors:", requestTypeResult.errors);
    }

    // Validate response type
    console.log("\nValidating response type...");
    const responseTypeResult = await typedAPIAdapter.validateResponseType(contractPath);
    
    if (responseTypeResult.success) {
      console.log("✅ Response type validation passed!");
      console.log("Details:", JSON.stringify(responseTypeResult.details, null, 2));
    } else {
      console.log("❌ Response type validation failed!");
      console.log("Errors:", responseTypeResult.errors);
    }

    // Test request validation
    console.log("\nValidating request...");
    const requestValidationResult = await typedAPIAdapter.validateRequestAgainstContract(
      contractPath,
      {
        query: {
          status: 'active',
          companyId: '12345'
        }
      }
    );
    
    if (requestValidationResult.success) {
      console.log("✅ Request validation passed!");
      console.log("Details:", JSON.stringify(requestValidationResult.details, null, 2));
    } else {
      console.log("❌ Request validation failed!");
      console.log("Errors:", requestValidationResult.errors);
    }

    // Generate mock response
    console.log("\nGenerating mock response...");
    const mockResponse = await typedAPIAdapter.generateMockResponse(contractPath);
    
    if (mockResponse.success) {
      console.log("✅ Mock response generated successfully!");
      console.log("Generated data:");
      console.log(JSON.stringify(mockResponse.data, null, 2));
    } else {
      console.log("❌ Failed to generate mock response!");
    }

    console.log("\n========== Integration Test Complete ==========\n");
    
    // Cleanup
    await typedAPIAdapter.cleanup();
    await ollamaAdapter.cleanup();
    
  } catch (error) {
    console.error("Error in integration test:", error);
  }
}

// Run the integration test if this file is executed directly
if (require.main === module) {
  runIntegrationTest().catch(error => {
    console.error("Error running integration test:", error);
    process.exit(1);
  });
}

export default runIntegrationTest;