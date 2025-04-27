import { TestExecutor, OllamaAdapter } from 'craft-a-tester';
import { TypedAPIAddon } from '../src';
import * as path from 'path';

/**
 * Example of using TypedAPI with a local Ollama model
 */
async function testWithOllama() {
  console.log('----- Testing TypedAPI With Ollama -----');
  
  // Create a test executor
  const executor = new TestExecutor({
    logging: {
      level: 'debug'
    }
  });
  
  // Initialize the Ollama adapter for LLM-driven testing
  const ollamaAdapter = new OllamaAdapter({
    baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
    model: process.env.OLLAMA_MODEL || 'phi4:14b-fp16',
    contextSize: parseInt(process.env.CONTEXT_SIZE || '16384'),
    dynamicContextSizing: true
  });
  
  // Register the Ollama adapter as the LLM provider
  executor.registerAdapter('llm', ollamaAdapter);
  
  // Create and register the TypedAPI addon
  const typedAPIAddon = new TypedAPIAddon({
    contractsBasePath: path.join(__dirname, '..', '..', 'shared', 'contracts'),
    validation: {
      strictMode: true
    }
  });
  
  // Register the addon with the executor
  executor.registerAddon(typedAPIAddon);
  
  try {
    // Initialize the Ollama adapter
    await ollamaAdapter.initialize();
    
    // Run a single TypedAPI test
    const testFile = path.join(__dirname, '..', 'tests', 'contract-validation.md');
    
    console.log(`\nRunning test: ${path.basename(testFile)}`);
    
    // Execute the test
    const result = await executor.runScenario(testFile);
    
    console.log(`\nTest ${result.success ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`- Duration: ${result.duration / 1000} seconds`);
    console.log(`- Steps completed: ${result.stepResults.length}`);
    
    // Show step results
    console.log('\nStep Results:');
    result.stepResults.forEach((step, index) => {
      console.log(`${index + 1}. ${step.step} - ${step.success ? '✅' : '❌'}`);
      if (!step.success && step.error) {
        console.log(`   Error: ${step.error}`);
      }
    });
    
    // Provide feedback on capability resolution
    await executor.provideFeedback({
      stepId: `${testFile}:2`,
      quality: "good",
      message: "Great job identifying the validateContract capability",
      source: "user",
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('Error running test:', error);
  } finally {
    // Cleanup
    await ollamaAdapter.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWithOllama().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default testWithOllama;