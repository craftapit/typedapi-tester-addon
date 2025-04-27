/**
 * Test stories runner for craft-a-tester-typedapi addon.
 */
import * as path from 'path';
import { createTestRunner } from '@craftapit/tester';
import { TypedAPIAdapter, TypedAPIAddon } from '../src';

async function runTestStories() {
  // Get the base stories directory
  const storiesDir = path.join(__dirname, 'stories');
  
  // Create the TypedAPI adapter for testing
  const typedApiAdapter = new TypedAPIAdapter({
    contractsBasePath: path.join(__dirname, 'fixtures', 'contracts'),
    validation: {
      strictMode: true,
      validateTypes: true
    }
  });
  
  // Create the addon
  const typedApiAddon = new TypedAPIAddon();
  
  // Create a test runner with the LLM adapter from environment variables
  const runner = createTestRunner({
    llmAdapter: (process.env.LLM_ADAPTER || 'ollama') as any,
    llmAdapterConfig: {
      baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'llama3',
      contextSize: parseInt(process.env.CONTEXT_SIZE || '16384', 10),
      dynamicContextSizing: process.env.DYNAMIC_SIZING?.toLowerCase() !== 'false',
      apiKey: process.env.API_KEY
    },
    adapters: {
      'typedapi': typedApiAdapter
    },
    addons: [typedApiAddon],
    caching: true,
    cachePath: path.join(__dirname, '.cache', 'addon-test-cache.json'),
    verbose: true
  });
  
  try {
    // Initialize the runner
    await runner.initialize();
    
    // Run the tests
    console.log('Running TypedAPI Addon test stories...');
    
    // Run all tests
    const results = await runner.runTestDirectory(storiesDir);
    
    // Print summary
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log('\n===== TypedAPI Addon Test Stories Summary =====');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed tests: ${passedTests}`);
    console.log(`Failed tests: ${failedTests}`);
    
    if (failedTests > 0) {
      console.log('\nFailed Tests:');
      Object.entries(results)
        .filter(([_, result]) => !result.passed)
        .forEach(([path, result]) => {
          console.log(`- ${path.replace(storiesDir, '')}: ${result.error || 'Failed steps'}`);
        });
      
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running tests:', error);
    process.exit(1);
  } finally {
    // Clean up
    await runner.cleanup();
  }
}

// Run the tests if this script is called directly
if (require.main === module) {
  runTestStories().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}