import path from 'path';
import { TypedAPIAddon } from '../src';
import { 
  TestExecutor, 
  CapabilityRegistry, 
  OllamaAdapter 
} from '@craftapit/tester';

/**
 * Run TypedAPI test scenarios using Craft-a-Tester
 */
async function runTestScenarios() {
  console.log("\n========== Running TypedAPI Test Scenarios ==========\n");

  try {
    // Create capability registry
    const registry = new CapabilityRegistry();
    console.log("Created capability registry");

    // Optionally try to set up Ollama adapter
    try {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      const ollamaModel = process.env.OLLAMA_MODEL || 'llama3:8b';
      const contextSize = parseInt(process.env.CONTEXT_SIZE || '8192', 10);
      const dynamicSizing = process.env.DYNAMIC_SIZING !== 'false';

      console.log(`Setting up Ollama adapter with model: ${ollamaModel}`);
      console.log(`URL: ${ollamaUrl}, Context Size: ${contextSize}, Dynamic Sizing: ${dynamicSizing}`);

      const ollamaAdapter = new OllamaAdapter({
        baseUrl: ollamaUrl,
        model: ollamaModel,
        contextSize,
        dynamicContextSizing: dynamicSizing
      });

      await ollamaAdapter.initialize();
      console.log("Ollama adapter initialized successfully");
      
      // Register LLM adapter
      registry.setLLMAdapter(ollamaAdapter);
      console.log("Registered Ollama as LLM adapter for capability resolution");
    } catch (error) {
      console.log("Ollama not available, continuing without LLM capability resolution");
      console.log("(This is fine, we'll use direct capability calls)");
    }

    // Create and register TypedAPI addon
    const typedAPIAddon = new TypedAPIAddon({
      contractsBasePath: path.resolve(__dirname, '../../shared/contracts'),
      validation: {
        strictMode: true,
        validateTypes: true,
        validatePaths: true
      }
    });
    console.log("Created TypedAPI addon");

    // Register with registry
    typedAPIAddon.register(registry);
    console.log("Registered TypedAPI addon with registry");

    // Create test executor
    const executor = new TestExecutor();
    console.log("Created test executor");

    // Path to test scenarios
    const scenarioFile = path.resolve(__dirname, '../tests/contract-validation.md');
    console.log(`Running test scenarios from: ${scenarioFile}`);

    // Execute the tests
    console.log("\n----- Starting Test Execution -----\n");
    const results = await executor.executeTests(scenarioFile, {
      registry,
      context: {
        contractsBasePath: path.resolve(__dirname, '../../shared/contracts')
      }
    });

    // Display results
    console.log("\n----- Test Execution Complete -----\n");
    console.log(`Total scenarios: ${results.scenarioResults.length}`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const scenario of results.scenarioResults) {
      const status = scenario.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status}: ${scenario.title}`);
      
      if (scenario.success) {
        successCount++;
      } else {
        failureCount++;
        
        // Show step failures
        for (const step of scenario.stepResults) {
          if (!step.success) {
            console.log(`  - Failed step: ${step.text}`);
            console.log(`    Error: ${step.error}`);
          }
        }
      }
    }
    
    console.log(`\nResults: ${successCount} passed, ${failureCount} failed`);
    const successRate = (successCount / results.scenarioResults.length) * 100;
    console.log(`Success rate: ${successRate.toFixed(2)}%`);
    
    console.log("\n========== Test Execution Complete ==========\n");
  } catch (error) {
    console.error("Error running test scenarios:", error);
  }
}

// Run the integration test if this file is executed directly
if (require.main === module) {
  runTestScenarios().catch(error => {
    console.error("Error running test scenarios:", error);
    process.exit(1);
  });
}

export default runTestScenarios;