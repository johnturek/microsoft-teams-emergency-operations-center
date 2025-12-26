/**
 * Environment variable validation and configuration
 * This ensures all required environment variables are present before the app runs
 */

interface EnvConfig {
    // Add your required environment variables here
    // Example:
    // REACT_APP_SITE_ID: string;
    // REACT_APP_TENANT_ID: string;
    // REACT_APP_CLIENT_ID: string;
}

/**
 * Validates that all required environment variables are present
 * Throws an error if any are missing
 */
function validateEnv(): EnvConfig {
    // Define required environment variables
    const required: string[] = [
        // Add required env vars here
        // 'REACT_APP_SITE_ID',
        // 'REACT_APP_TENANT_ID',
        // 'REACT_APP_CLIENT_ID',
    ];

    // Check for missing variables
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables:\n${missing.join('\n')}\n\n` +
            'Please ensure your .env file is properly configured.\n' +
            'See .env.example for required variables.'
        );
    }

    // Return validated config
    return {
        // Map environment variables to config object
        // REACT_APP_SITE_ID: process.env.REACT_APP_SITE_ID!,
        // REACT_APP_TENANT_ID: process.env.REACT_APP_TENANT_ID!,
        // REACT_APP_CLIENT_ID: process.env.REACT_APP_CLIENT_ID!,
    };
}

/**
 * Validated environment configuration
 * Safe to use throughout the application
 */
export const env = validateEnv();

/**
 * Helper to get optional environment variables with defaults
 */
export function getEnvOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

/**
 * Check if running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Check if running in test mode
 */
export const isTest = process.env.NODE_ENV === 'test';
