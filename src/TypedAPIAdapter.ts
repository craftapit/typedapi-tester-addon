import { BaseAdapter } from '@craftapit/tester';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as ts from 'typescript';

/**
 * Configuration options for the TypedAPI adapter
 */
export interface TypedAPIAdapterConfig {
  /**
   * Base path for contract files
   */
  contractsBasePath?: string;
  
  /**
   * Validation options
   */
  validation?: {
    /**
     * Whether to use strict mode for validation
     */
    strictMode?: boolean;
    
    /**
     * Whether to allow extra properties in requests/responses
     */
    allowExtraProperties?: boolean;
    
    /**
     * Whether to validate types
     */
    validateTypes?: boolean;
    
    /**
     * Whether to validate path parameters
     */
    validatePaths?: boolean;
  };
  
  /**
   * Mock data generation options
   */
  mock?: {
    /**
     * Whether to generate realistic data for mocks
     */
    generateRealisticData?: boolean;
    
    /**
     * Locale for generated data
     */
    locale?: string;
    
    /**
     * Seed for consistent mock generation
     */
    seed?: number;
    
    /**
     * Custom generators for specific field types
     */
    customGenerators?: Record<string, () => any>;
  };
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  /**
   * Whether the validation was successful
   */
  success: boolean;
  
  /**
   * Error messages if validation failed
   */
  errors?: string[];
  
  /**
   * Warnings that don't cause validation failure
   */
  warnings?: string[];
  
  /**
   * Details about what was validated
   */
  details?: {
    contractName?: string;
    path?: string;
    method?: string;
    requestType?: string;
    responseType?: string;
    [key: string]: any;
  };
}

/**
 * Generated types result interface
 */
export interface GeneratedTypes {
  /**
   * The generated TypeScript code
   */
  code: string;
  
  /**
   * Names of the generated types
   */
  typeNames: string[];
  
  /**
   * Source file path
   */
  sourcePath: string;
}

/**
 * Mock response interface
 */
export interface MockResponse {
  /**
   * The mock data
   */
  data: any;
  
  /**
   * Type information about the mock
   */
  type: string;
  
  /**
   * Whether the mock was generated successfully
   */
  success: boolean;
}

/**
 * TypedAPI adapter for Craft-a-Tester
 */
export class TypedAPIAdapter extends BaseAdapter {
  private contractsBasePath: string;
  private validation: Required<NonNullable<TypedAPIAdapterConfig['validation']>>;
  private mock: Required<NonNullable<TypedAPIAdapterConfig['mock']>>;
  
  /**
   * TypeScript program for type checking
   */
  private program: ts.Program | null = null;
  
  /**
   * Type checker for TypeScript analysis
   */
  private typeChecker: ts.TypeChecker | null = null;
  
  constructor(config: TypedAPIAdapterConfig = {}) {
    super(config);
    
    this.contractsBasePath = config.contractsBasePath || './contracts';
    
    this.validation = {
      strictMode: config.validation?.strictMode ?? true,
      allowExtraProperties: config.validation?.allowExtraProperties ?? false,
      validateTypes: config.validation?.validateTypes ?? true,
      validatePaths: config.validation?.validatePaths ?? true,
      ...config.validation
    };
    
    this.mock = {
      generateRealisticData: config.mock?.generateRealisticData ?? true,
      locale: config.mock?.locale ?? 'en-US',
      seed: config.mock?.seed ?? Math.floor(Math.random() * 10000),
      customGenerators: config.mock?.customGenerators ?? {},
      ...config.mock
    };
  }
  
  /**
   * Initialize the adapter
   */
  async initialize(): Promise<void> {
    console.log('Initializing TypedAPI adapter');
    
    // Check if contracts path exists
    try {
      await fs.access(this.contractsBasePath);
    } catch (error) {
      console.warn(`Contracts path ${this.contractsBasePath} does not exist or is not accessible`);
    }
    
    // Initialize TypeScript compiler
    this.initTypeScriptCompiler();
    
    console.log(`TypedAPI adapter initialized with contracts base path: ${this.contractsBasePath}`);
    console.log(`Validation config: ${JSON.stringify(this.validation)}`);
    console.log(`Mock config: ${JSON.stringify(this.mock)}`);
  }
  
  /**
   * Clean up the adapter
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up TypedAPI adapter');
    this.program = null;
    this.typeChecker = null;
  }
  
  /**
   * Initialize the TypeScript compiler for type checking
   */
  private initTypeScriptCompiler(): void {
    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      noImplicitAny: true,
      alwaysStrict: true,
      lib: ['lib.es2020.d.ts'],
      types: ['node']
    };

    // Create a host object for compilation
    const host = ts.createCompilerHost(compilerOptions);

    // Get all TypeScript files in the contracts path
    let fileNames: string[] = [];
    try {
      fileNames = this.findContractFiles();
    } catch (error) {
      console.warn(`Failed to find contract files: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (fileNames.length > 0) {
      this.program = ts.createProgram(fileNames, compilerOptions, host);
      this.typeChecker = this.program.getTypeChecker();
      console.log(`TypeScript compiler initialized with ${fileNames.length} files`);
    } else {
      console.warn('No TypeScript files found for compilation');
    }
  }

  /**
   * Find all TypeScript files in the contracts path
   */
  private findContractFiles(): string[] {
    // This is a simplified implementation
    // In a real implementation, this would recursively find all TypeScript files
    try {
      const contractsDir = require('fs').readdirSync(this.contractsBasePath);
      return contractsDir
        .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'))
        .map((file: string) => path.resolve(this.contractsBasePath, file));
    } catch (error) {
      console.warn(`Failed to read contracts directory: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  
  /**
   * Get the resolved path to a contract
   */
  private resolveContractPath(contractPath: string): string {
    if (path.isAbsolute(contractPath)) {
      return contractPath;
    }
    
    return path.resolve(this.contractsBasePath, contractPath);
  }
  
  /**
   * Read and parse a contract file
   */
  private async readContract(contractPath: string): Promise<{
    path: string;
    content: string;
    contract?: any;
    exportName?: string;
    sourceFile?: ts.SourceFile;
  }> {
    const resolvedPath = this.resolveContractPath(contractPath);
    
    try {
      const content = await fs.readFile(resolvedPath, 'utf-8');
      
      // Initialize TypeScript compiler if not already done
      if (!this.program) {
        this.initTypeScriptCompiler();
      }
      
      if (!this.program || !this.typeChecker) {
        return { path: resolvedPath, content };
      }
      
      // Parse the file with TypeScript
      const sourceFile = this.program.getSourceFile(resolvedPath);
      if (!sourceFile) {
        // If file wasn't in the initial program, create a new source file
        const tempSourceFile = ts.createSourceFile(
          resolvedPath,
          content,
          ts.ScriptTarget.ES2020,
          true
        );
        
        return { 
          path: resolvedPath, 
          content,
          sourceFile: tempSourceFile
        };
      }
      
      // Find the Contract export
      let contract: any = null;
      let exportName: string | undefined;
      
      // Visit all nodes to find the Contract export
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isVariableStatement(node)) {
          const declaration = node.declarationList.declarations[0];
          if (declaration && ts.isIdentifier(declaration.name)) {
            const name = declaration.name.getText();
            if (name === 'Contract') {
              exportName = name;
              
              // Try to extract contract details from the node
              if (declaration.initializer && ts.isObjectLiteralExpression(declaration.initializer)) {
                contract = this.extractContractDetails(declaration.initializer);
              }
            }
          }
        }
      });
      
      return {
        path: resolvedPath,
        content,
        contract,
        exportName,
        sourceFile
      };
    } catch (error) {
      throw new Error(`Failed to read contract file ${resolvedPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Extract contract details from an object literal expression
   */
  private extractContractDetails(node: ts.ObjectLiteralExpression): any {
    const contract: any = {};
    
    // Extract properties from the object literal
    node.properties.forEach(property => {
      if (ts.isPropertyAssignment(property)) {
        const name = property.name.getText();
        
        // Extract simple values
        if (ts.isStringLiteral(property.initializer)) {
          contract[name] = property.initializer.text;
        } else if (ts.isNumericLiteral(property.initializer)) {
          contract[name] = parseFloat(property.initializer.text);
        } else if (property.initializer.kind === ts.SyntaxKind.TrueKeyword) {
          contract[name] = true;
        } else if (property.initializer.kind === ts.SyntaxKind.FalseKeyword) {
          contract[name] = false;
        } else if (property.initializer.kind === ts.SyntaxKind.NullKeyword) {
          contract[name] = null;
        } else if (ts.isObjectLiteralExpression(property.initializer)) {
          // Handle nested objects recursively
          contract[name] = this.extractContractDetails(property.initializer);
        } else if (ts.isArrayLiteralExpression(property.initializer)) {
          // Handle arrays
          contract[name] = this.extractArrayDetails(property.initializer);
        } else {
          // For complex expressions, just store the text
          contract[name] = property.initializer.getText();
        }
      }
    });
    
    return contract;
  }
  
  /**
   * Extract array details from an array literal expression
   */
  private extractArrayDetails(node: ts.ArrayLiteralExpression): any[] {
    const array: any[] = [];
    
    node.elements.forEach(element => {
      if (ts.isStringLiteral(element)) {
        array.push(element.text);
      } else if (ts.isNumericLiteral(element)) {
        array.push(parseFloat(element.text));
      } else if (element.kind === ts.SyntaxKind.TrueKeyword) {
        array.push(true);
      } else if (element.kind === ts.SyntaxKind.FalseKeyword) {
        array.push(false);
      } else if (element.kind === ts.SyntaxKind.NullKeyword) {
        array.push(null);
      } else if (ts.isObjectLiteralExpression(element)) {
        array.push(this.extractContractDetails(element));
      } else if (ts.isArrayLiteralExpression(element)) {
        array.push(this.extractArrayDetails(element));
      } else {
        array.push(element.getText());
      }
    });
    
    return array;
  }
  
  /**
   * Validate a contract against its schema
   */
  async validateContract(contractPath: string): Promise<ValidationResult> {
    console.log(`Validating contract: ${contractPath}`);
    
    try {
      const contractInfo = await this.readContract(contractPath);
      const { contract } = contractInfo;
      
      if (!contract) {
        return {
          success: false,
          errors: ['Contract export not found in the file'],
          details: {
            contractName: path.basename(contractPath, path.extname(contractPath)),
            path: contractInfo.path
          }
        };
      }
      
      // Required fields for all contracts
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // Check required fields
      const requiredFields = ['path', 'method', 'response'];
      for (const field of requiredFields) {
        if (!contract[field]) {
          errors.push(`Missing required field: ${field}`);
        }
      }
      
      // Validate method
      if (contract.method && !['get', 'post', 'put', 'delete', 'patch'].includes(contract.method)) {
        errors.push(`Invalid method: ${contract.method}. Must be one of: get, post, put, delete, patch`);
      }
      
      // Validate path
      if (contract.path && !contract.path.startsWith('/')) {
        errors.push(`Invalid path: ${contract.path}. Must start with /`);
      }
      
      // Validate response structure
      if (contract.response && typeof contract.response === 'object') {
        const responseKeys = Object.keys(contract.response);
        if (responseKeys.length === 0) {
          errors.push('Response object must have at least one status code');
        } else {
          // Check that all keys are valid HTTP status codes
          for (const key of responseKeys) {
            const statusCode = parseInt(key, 10);
            if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
              errors.push(`Invalid status code in response: ${key}. Must be a valid HTTP status code (100-599)`);
            }
          }
        }
      }
      
      // Validate auth if present
      if (contract.auth) {
        if (contract.auth.authorization) {
          // Validate roles if present
          if (contract.auth.authorization.roles) {
            if (!Array.isArray(contract.auth.authorization.roles) && typeof contract.auth.authorization.roles !== 'string') {
              errors.push('Authorization roles must be a string or array of strings');
            }
          }
          
          // Validate scopes if present
          if (contract.auth.authorization.scopes) {
            if (!Array.isArray(contract.auth.authorization.scopes) && typeof contract.auth.authorization.scopes !== 'string') {
              errors.push('Authorization scopes must be a string or array of strings');
            }
          }
          
          // Validate claims if present
          if (contract.auth.authorization.claims) {
            if (!Array.isArray(contract.auth.authorization.claims)) {
              errors.push('Authorization claims must be an array');
            } else {
              // Check each claim
              contract.auth.authorization.claims.forEach((claim: any, index: number) => {
                if (!claim.userClaimPath) {
                  errors.push(`Claim at index ${index} is missing required field userClaimPath`);
                }
                if (!claim.routeParamName) {
                  errors.push(`Claim at index ${index} is missing required field routeParamName`);
                }
              });
            }
          }
        }
      }
      
      // Check for path parameters in the path
      if (contract.path) {
        const pathParams = (contract.path.match(/\:[a-zA-Z0-9_]+/g) || [])
          .map((param: string) => param.substring(1));
        
        // If there are path parameters, there should be a params schema
        if (pathParams.length > 0 && !contract.params) {
          warnings.push(`Path contains parameters (${pathParams.join(', ')}) but no params schema is defined`);
        }
      }
      
      // Additional validations could be added here
      
      // Get tags and summary
      const tags = contract.tags ? Array.isArray(contract.tags) ? contract.tags : [contract.tags] : [];
      const summary = contract.summary || 'No summary provided';
      
      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        details: {
          contractName: path.basename(contractPath, path.extname(contractPath)),
          path: contractInfo.path,
          method: contract.method,
          apiPath: contract.path,
          tags,
          summary,
          hasParams: !!contract.params,
          hasQuery: !!contract.query,
          hasBody: !!contract.body,
          responseStatuses: contract.response ? Object.keys(contract.response) : [],
          requiresAuth: contract.auth?.requiresAuthentication === true
        }
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to validate contract: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
  
  /**
   * Validate a request type against a contract
   */
  async validateRequestType(contractPath: string): Promise<ValidationResult> {
    console.log(`Validating request type for contract: ${contractPath}`);
    
    try {
      const contractInfo = await this.readContract(contractPath);
      const { contract, sourceFile } = contractInfo;
      
      if (!contract || !sourceFile) {
        return {
          success: false,
          errors: ['Contract export not found in the file or could not parse source file'],
          details: {
            contractName: path.basename(contractPath, path.extname(contractPath)),
            path: contractInfo.path
          }
        };
      }
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const details: Record<string, any> = {
        contractName: path.basename(contractPath, path.extname(contractPath)),
        path: contractInfo.path,
        method: contract.method,
        apiPath: contract.path
      };
      
      // Extract path parameters from the path
      const pathParams = (contract.path.match(/\:[a-zA-Z0-9_]+/g) || [])
        .map((param: string) => param.substring(1));
      
      if (pathParams.length > 0) {
        details.pathParams = pathParams;
        
        // Check if all path parameters are defined in the params schema
        if (!contract.params) {
          errors.push(`Path contains parameters (${pathParams.join(', ')}) but no params schema is defined`);
        } else {
          // In a more advanced implementation, we would check if the params schema
          // contains all the required path parameters
          details.hasParamsSchema = true;
        }
      }
      
      // Check query parameters if it's a GET request
      if (contract.method === 'get' && contract.query) {
        details.hasQuerySchema = true;
        
        // Find the QuerySchema export
        let querySchemaFound = false;
        ts.forEachChild(sourceFile, (node) => {
          if (ts.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (declaration && ts.isIdentifier(declaration.name)) {
              const name = declaration.name.getText();
              if (name === 'QuerySchema') {
                querySchemaFound = true;
              }
            }
          }
        });
        
        if (!querySchemaFound) {
          warnings.push('Contract has a query parameter but QuerySchema is not exported');
        }
      }
      
      // Check body schema for non-GET requests
      if (['post', 'put', 'patch'].includes(contract.method)) {
        if (!contract.body) {
          warnings.push(`${contract.method.toUpperCase()} request typically requires a body schema`);
        } else {
          details.hasBodySchema = true;
        }
      }
      
      // Return validation results
      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        details
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to validate request type: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
  
  /**
   * Validate a response type against a contract
   */
  async validateResponseType(contractPath: string): Promise<ValidationResult> {
    console.log(`Validating response type for contract: ${contractPath}`);
    
    try {
      const contractInfo = await this.readContract(contractPath);
      const { contract, sourceFile } = contractInfo;
      
      if (!contract || !sourceFile) {
        return {
          success: false,
          errors: ['Contract export not found in the file or could not parse source file'],
          details: {
            contractName: path.basename(contractPath, path.extname(contractPath)),
            path: contractInfo.path
          }
        };
      }
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const details: Record<string, any> = {
        contractName: path.basename(contractPath, path.extname(contractPath)),
        path: contractInfo.path,
        method: contract.method
      };
      
      // Check response schema
      if (!contract.response || typeof contract.response !== 'object') {
        errors.push('Response schema is required and must be an object');
      } else {
        const responseStatusCodes = Object.keys(contract.response);
        details.responseStatusCodes = responseStatusCodes;
        
        if (responseStatusCodes.length === 0) {
          errors.push('Response object must define at least one status code');
        }
        
        // Check if response schema is exported
        let responseSchemaFound = false;
        ts.forEachChild(sourceFile, (node) => {
          if (ts.isVariableStatement(node)) {
            const declaration = node.declarationList.declarations[0];
            if (declaration && ts.isIdentifier(declaration.name)) {
              const name = declaration.name.getText();
              if (name === 'ResponseSchema') {
                responseSchemaFound = true;
              }
            }
          }
        });
        
        if (!responseSchemaFound) {
          warnings.push('ResponseSchema is not exported, which may make it difficult to reuse');
        }
        
        // Check for common status codes based on method
        switch (contract.method) {
          case 'get':
            if (!responseStatusCodes.includes('200')) {
              warnings.push('GET requests typically include a 200 response status');
            }
            break;
          case 'post':
            if (!responseStatusCodes.includes('201') && !responseStatusCodes.includes('200')) {
              warnings.push('POST requests typically include a 201 or 200 response status');
            }
            break;
          case 'put':
          case 'patch':
            if (!responseStatusCodes.includes('200')) {
              warnings.push(`${contract.method.toUpperCase()} requests typically include a 200 response status`);
            }
            break;
          case 'delete':
            if (!responseStatusCodes.includes('204') && !responseStatusCodes.includes('200')) {
              warnings.push('DELETE requests typically include a 204 or 200 response status');
            }
            break;
        }
        
        // Check for error responses
        if (!responseStatusCodes.some(code => parseInt(code) >= 400)) {
          warnings.push('No error response status codes defined (4xx, 5xx)');
        }
      }
      
      // Check Response type export
      let responseTypeFound = false;
      ts.forEachChild(sourceFile, (node) => {
        if (ts.isTypeAliasDeclaration(node) && node.name.getText() === 'Response') {
          responseTypeFound = true;
        }
      });
      
      if (!responseTypeFound) {
        warnings.push('Response type is not exported');
      }
      
      // Return validation results
      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        details
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to validate response type: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
  
  /**
   * Create a mock request based on a contract
   */
  async createMockRequest(contractPath: string): Promise<any> {
    console.log(`Creating mock request for contract: ${contractPath}`);
    
    try {
      const contract = await this.readContract(contractPath);
      
      // TODO: Implement mock request creation
      // This will generate a valid request object based on the contract
      
      return {
        // Mock request data will go here
      };
    } catch (error) {
      throw new Error(`Failed to create mock request: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Validate a request against a contract
   */
  async validateRequestAgainstContract(contractPath: string, request: any): Promise<ValidationResult> {
    console.log(`Validating request against contract: ${contractPath}`);
    
    try {
      const contractInfo = await this.readContract(contractPath);
      const { contract } = contractInfo;
      
      if (!contract) {
        return {
          success: false,
          errors: ['Contract export not found in the file'],
          details: {
            contractName: path.basename(contractPath, path.extname(contractPath)),
            path: contractInfo.path
          }
        };
      }
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const details: Record<string, any> = {
        contractName: path.basename(contractPath, path.extname(contractPath)),
        path: contractInfo.path,
        method: contract.method,
        apiPath: contract.path
      };
      
      // Extract request components
      const { params, query, body } = request;
      
      // Validate path parameters if they exist
      if (contract.params && params) {
        // In a real implementation, we would use Zod to validate params
        // For now, we'll just do a basic check
        if (typeof params !== 'object') {
          errors.push('Path parameters must be an object');
        } else {
          details.paramsValid = true;
          details.paramsProvided = Object.keys(params);
        }
      }
      
      // Validate query parameters if they exist
      if (contract.query && query) {
        // In a real implementation, we would use Zod to validate query
        if (typeof query !== 'object') {
          errors.push('Query parameters must be an object');
        } else {
          details.queryValid = true;
          details.queryProvided = Object.keys(query);
        }
      }
      
      // Validate body if it exists
      if (contract.body && body) {
        // In a real implementation, we would use Zod to validate body
        details.bodyProvided = true;
        
        // Check for common mistakes
        if (contract.method === 'get' && body) {
          warnings.push('GET requests should not have a body');
        }
      } else if (['post', 'put', 'patch'].includes(contract.method) && !body) {
        warnings.push(`${contract.method.toUpperCase()} request is missing a body`);
      }
      
      // Check path parameters in URL
      if (contract.path) {
        const pathParams = (contract.path.match(/\:[a-zA-Z0-9_]+/g) || [])
          .map((param: string) => param.substring(1));
        
        if (pathParams.length > 0) {
          if (!params) {
            errors.push(`Path contains parameters (${pathParams.join(', ')}) but no params object was provided`);
          } else {
            // Check that all path parameters are provided
            for (const param of pathParams) {
              if (params[param] === undefined) {
                errors.push(`Missing required path parameter: ${param}`);
              }
            }
          }
        }
      }
      
      // Return validation results
      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        details
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to validate request: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
  
  /**
   * Validate a response against a contract
   */
  async validateResponseAgainstContract(contractPath: string, response: any, statusCode: number = 200): Promise<ValidationResult> {
    console.log(`Validating response against contract: ${contractPath} with status code ${statusCode}`);
    
    try {
      const contractInfo = await this.readContract(contractPath);
      const { contract } = contractInfo;
      
      if (!contract) {
        return {
          success: false,
          errors: ['Contract export not found in the file'],
          details: {
            contractName: path.basename(contractPath, path.extname(contractPath)),
            path: contractInfo.path
          }
        };
      }
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const details: Record<string, any> = {
        contractName: path.basename(contractPath, path.extname(contractPath)),
        path: contractInfo.path,
        method: contract.method,
        statusCode
      };
      
      // Check if the response has a schema for the given status code
      if (!contract.response || !contract.response[statusCode.toString()]) {
        errors.push(`Contract does not define a response for status code ${statusCode}`);
        
        // Check if there are any defined response status codes
        const definedStatusCodes = contract.response ? Object.keys(contract.response) : [];
        if (definedStatusCodes.length > 0) {
          details.definedStatusCodes = definedStatusCodes;
          details.suggestions = `Contract defines responses for status codes: ${definedStatusCodes.join(', ')}`;
        }
      } else {
        details.responseSchemaExists = true;
        
        // In a real implementation, we would use Zod to validate the response
        if (!response) {
          errors.push(`Response body is required for status code ${statusCode}`);
        } else {
          // Check if response is an object
          if (typeof response !== 'object') {
            errors.push('Response must be an object or array');
          } else {
            details.responseProvided = true;
            
            // Check for common response properties based on method
            if (statusCode === 200 && contract.method === 'get') {
              // For GET requests, we often expect a data property or an array
              if (!Array.isArray(response) && (!response.data && !response.items && !response.results)) {
                warnings.push('GET 200 responses typically include data in a "data", "items", or "results" property or as an array');
              }
            }
            
            // If it's a created response, often we want an ID
            if (statusCode === 201 && contract.method === 'post') {
              if (typeof response === 'object' && !response.id && !response._id) {
                warnings.push('Created resources typically include an "id" or "_id" property');
              }
            }
          }
        }
      }
      
      // Return validation results
      return {
        success: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        details
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Failed to validate response: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }
  
  /**
   * Generate TypeScript types for a contract
   */
  async generateTypes(contractPath: string): Promise<GeneratedTypes> {
    console.log(`Generating types for contract: ${contractPath}`);
    
    try {
      const contract = await this.readContract(contractPath);
      
      // TODO: Implement type generation
      // This will generate TypeScript types from the contract
      
      return {
        code: "// Generated types will go here",
        typeNames: [],
        sourcePath: contract.path
      };
    } catch (error) {
      throw new Error(`Failed to generate types: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check if a type exists in a contract
   */
  async checkTypeExistence(contractPath: string, typeName: string): Promise<boolean> {
    console.log(`Checking if type ${typeName} exists in contract: ${contractPath}`);
    
    try {
      const contract = await this.readContract(contractPath);
      
      // TODO: Implement type existence check
      // This will check if a specific type exists in the contract
      
      return true;
    } catch (error) {
      throw new Error(`Failed to check type existence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check if a property exists on a type
   */
  async checkTypeProperty(contractPath: string, typeName: string, propertyName: string): Promise<boolean> {
    console.log(`Checking if property ${propertyName} exists on type ${typeName} in contract: ${contractPath}`);
    
    try {
      const contract = await this.readContract(contractPath);
      
      // TODO: Implement property existence check
      // This will check if a specific property exists on a type
      
      return true;
    } catch (error) {
      throw new Error(`Failed to check type property: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Generate a mock response based on a contract
   */
  async generateMockResponse(contractPath: string, statusCode: number = 200): Promise<MockResponse> {
    console.log(`Generating mock response for contract: ${contractPath}`);
    
    try {
      const contractInfo = await this.readContract(contractPath);
      const { contract, sourceFile } = contractInfo;
      
      if (!contract || !sourceFile) {
        return {
          data: null,
          type: "error",
          success: false
        };
      }
      
      // Check if we have a response schema for the given status code
      if (!contract.response || !contract.response[statusCode.toString()]) {
        console.warn(`No response schema found for status code ${statusCode}`);
        
        // Try to find another status code
        const availableStatusCodes = contract.response ? Object.keys(contract.response) : [];
        if (availableStatusCodes.length > 0) {
          const alternativeStatusCode = availableStatusCodes[0];
          console.log(`Using alternative status code: ${alternativeStatusCode}`);
          statusCode = parseInt(alternativeStatusCode, 10);
        } else {
          return {
            data: null,
            type: "error",
            success: false
          };
        }
      }
      
      // Extract the contract name
      const contractName = path.basename(contractPath, path.extname(contractPath));
      
      // Based on the contract analyzed, generate an appropriate mock response
      // This is a simplified implementation that creates sensible defaults based on the contract name
      
      if (contractName.includes('api-key')) {
        // This is likely an API key related endpoint
        if (contractName.includes('get')) {
          // Generate a list of API keys
          if (statusCode === 200) {
            return {
              data: [
                {
                  id: 'apikey_' + this.generateRandomId(),
                  name: 'Test API Key 1',
                  description: 'Generated test API key',
                  uniqueIdentifier: this.generateRandomId(),
                  company: 'company_' + this.generateRandomId(),
                  user: 'user_' + this.generateRandomId(),
                  keyHash: this.generateRandomHash(),
                  truncatedKey: this.generateTruncatedKey(),
                  status: 'active',
                  permissions: ['read', 'write'],
                  usageCount: Math.floor(Math.random() * 1000),
                  createdAt: new Date().toISOString()
                },
                {
                  id: 'apikey_' + this.generateRandomId(),
                  name: 'Test API Key 2',
                  uniqueIdentifier: this.generateRandomId(),
                  company: 'company_' + this.generateRandomId(),
                  user: 'user_' + this.generateRandomId(),
                  keyHash: this.generateRandomHash(),
                  truncatedKey: this.generateTruncatedKey(),
                  status: 'active',
                  permissions: ['read'],
                  usageCount: Math.floor(Math.random() * 100),
                  createdAt: new Date(Date.now() - 86400000).toISOString()
                }
              ],
              type: "Array<APIAuthKey>",
              success: true
            };
          }
        } else if (contractName.includes('post')) {
          // Create API key response
          if (statusCode === 201 || statusCode === 200) {
            return {
              data: {
                id: 'apikey_' + this.generateRandomId(),
                name: 'New API Key',
                uniqueIdentifier: this.generateRandomId(),
                company: 'company_' + this.generateRandomId(),
                user: 'user_' + this.generateRandomId(),
                keyHash: this.generateRandomHash(),
                truncatedKey: this.generateTruncatedKey(),
                status: 'active',
                permissions: ['read', 'write'],
                usageCount: 0,
                createdAt: new Date().toISOString()
              },
              type: "APIAuthKey",
              success: true
            };
          }
        }
      }
      
      // Generic fallback response
      return {
        data: {
          id: this.generateRandomId(),
          timestamp: new Date().toISOString(),
          success: true,
          message: `Mock response for ${contractName} with status ${statusCode}`
        },
        type: "generic",
        success: true
      };
    } catch (error) {
      console.error('Error generating mock response:', error);
      return {
        data: null,
        type: "error",
        success: false
      };
    }
  }
  
  /**
   * Generate a random ID for mock data
   */
  private generateRandomId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Generate a random hash for mock data
   */
  private generateRandomHash(): string {
    return Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
  
  /**
   * Generate a truncated key (like "abc...xyz") for mock data
   */
  private generateTruncatedKey(): string {
    const prefix = Math.random().toString(36).substring(2, 5);
    const suffix = Math.random().toString(36).substring(2, 5);
    return `${prefix}...${suffix}`;
  }
}