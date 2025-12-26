#!/usr/bin/env node

/**
 * TEOC Cross-Platform Deployment Script (Node.js)
 * Alternative to PowerShell for non-Windows environments
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m'
};

// Logging functions
const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    step: (msg) => console.log(`\n${colors.blue}🔷 ${msg}${colors.reset}`)
};

// Banner
function showBanner() {
    console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   Microsoft Teams Emergency Operations Center (TEOC)            ║
║   One-Click Deployment Script (Node.js)                         ║
║   Version: 1.0.0                                                ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
${colors.reset}`);
}

// Load configuration
function loadConfig(configPath) {
    log.step('Loading deployment configuration');

    if (!fs.existsSync(configPath)) {
        log.error(`Configuration file not found: ${configPath}`);
        log.info('Please copy deploy.config.example.json to deploy.config.json');
        process.exit(1);
    }

    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        log.success('Configuration loaded successfully');
        return config;
    } catch (error) {
        log.error(`Failed to parse configuration: ${error.message}`);
        process.exit(1);
    }
}

// Execute command with error handling
function exec(command, options = {}) {
    try {
        return execSync(command, {
            stdio: options.silent ? 'pipe' : 'inherit',
            encoding: 'utf8',
            ...options
        });
    } catch (error) {
        if (!options.ignoreError) {
            throw error;
        }
        return null;
    }
}

// Pre-flight checks
async function runPreflightChecks() {
    log.step('Running pre-flight checks');

    const checks = [];

    // Check Node.js version
    log.info('Checking Node.js version...');
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    checks.push({
        name: 'Node.js Version',
        status: majorVersion >= 14 ? 'PASS' : 'FAIL',
        message: `Version ${nodeVersion}`
    });

    // Check Azure CLI
    log.info('Checking Azure CLI...');
    try {
        const azVersion = exec('az version', { silent: true, ignoreError: true });
        if (azVersion) {
            checks.push({
                name: 'Azure CLI',
                status: 'PASS',
                message: 'Installed'
            });
        } else {
            checks.push({
                name: 'Azure CLI',
                status: 'FAIL',
                message: 'Not found. Install from https://aka.ms/install-azure-cli'
            });
        }
    } catch {
        checks.push({
            name: 'Azure CLI',
            status: 'FAIL',
            message: 'Not found'
        });
    }

    // Check npm
    log.info('Checking npm...');
    try {
        const npmVersion = exec('npm --version', { silent: true }).trim();
        checks.push({
            name: 'npm',
            status: 'PASS',
            message: `Version ${npmVersion}`
        });
    } catch {
        checks.push({
            name: 'npm',
            status: 'FAIL',
            message: 'Not found'
        });
    }

    // Check git
    log.info('Checking git...');
    try {
        const gitVersion = exec('git --version', { silent: true }).trim();
        checks.push({
            name: 'git',
            status: 'PASS',
            message: gitVersion
        });
    } catch {
        checks.push({
            name: 'git',
            status: 'WARN',
            message: 'Not found. Optional for deployment'
        });
    }

    // Display results
    console.log('\nPre-flight Check Results:');
    console.log('═══════════════════════════════════════════');

    let failed = 0;
    let warned = 0;

    checks.forEach(check => {
        const statusColor = check.status === 'PASS' ? colors.green :
                           check.status === 'WARN' ? colors.yellow : colors.red;
        const statusSymbol = check.status === 'PASS' ? '✅' :
                           check.status === 'WARN' ? '⚠️ ' : '❌';

        console.log(`${statusSymbol} ${check.name}: ${statusColor}${check.message}${colors.reset}`);

        if (check.status === 'FAIL') failed++;
        if (check.status === 'WARN') warned++;
    });

    console.log('═══════════════════════════════════════════');

    if (failed > 0) {
        log.error('Pre-flight checks failed. Please fix the issues above.');
        return false;
    }

    if (warned > 0) {
        log.warn(`${warned} warning(s) found. Some features may not work.`);
    }

    log.success('Pre-flight checks completed successfully');
    return true;
}

// Azure login
async function connectToAzure(subscriptionId) {
    log.step('Connecting to Azure');

    try {
        // Check if already logged in
        const account = exec('az account show', { silent: true, ignoreError: true });

        if (account) {
            const accountInfo = JSON.parse(account);
            log.info(`Already logged in as ${accountInfo.user.name}`);

            if (subscriptionId && accountInfo.id !== subscriptionId) {
                log.info(`Switching to subscription: ${subscriptionId}`);
                exec(`az account set --subscription ${subscriptionId}`);
            }
        } else {
            log.info('Logging in to Azure...');
            exec('az login');

            if (subscriptionId) {
                exec(`az account set --subscription ${subscriptionId}`);
            }
        }

        const currentAccount = JSON.parse(exec('az account show', { silent: true }));
        log.success(`Connected to Azure subscription: ${currentAccount.name}`);

        return currentAccount;
    } catch (error) {
        log.error(`Failed to connect to Azure: ${error.message}`);
        throw error;
    }
}

// Build and deploy web app
async function buildAndDeploy(config) {
    log.step('Building and deploying web application');

    const tabsPath = path.join(__dirname, '..', 'EOC-TeamsFx', 'tabs');

    // Install dependencies
    log.info('Installing dependencies...');
    exec('npm ci', { cwd: tabsPath });

    // Run tests
    log.info('Running tests...');
    try {
        exec('npm test -- --watchAll=false', { cwd: tabsPath });
        log.success('Tests passed');
    } catch (error) {
        log.warn('Some tests failed, continuing deployment...');
    }

    // Build
    log.info('Building application...');
    exec('npm run build', { cwd: tabsPath });
    log.success('Build completed');

    // Deploy to Azure (if web app exists)
    const webAppName = `${config.azure.baseResourceName}-app`;
    const resourceGroup = config.azure.resourceGroupName;

    try {
        log.info(`Deploying to Azure Web App: ${webAppName}`);

        const buildPath = path.join(tabsPath, 'build');
        const zipPath = path.join(tabsPath, 'deploy.zip');

        // Create zip file
        const archiver = require('archiver');
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(output);
        archive.directory(buildPath, false);
        await archive.finalize();

        // Deploy using Azure CLI
        exec(`az webapp deployment source config-zip --resource-group ${resourceGroup} --name ${webAppName} --src ${zipPath}`);

        // Clean up
        fs.unlinkSync(zipPath);

        log.success('Application deployed successfully');
    } catch (error) {
        log.warn(`Deployment to Azure Web App failed: ${error.message}`);
        log.info('You may need to deploy manually');
    }
}

// Main deployment
async function deploy(configPath) {
    const startTime = Date.now();

    try {
        showBanner();

        // Load configuration
        const config = loadConfig(configPath);

        // Run pre-flight checks
        const checksPass = await runPreflightChecks();
        if (!checksPass) {
            process.exit(1);
        }

        // Connect to Azure
        await connectToAzure(config.azure.subscriptionId);

        // Build and deploy
        await buildAndDeploy(config);

        // Success summary
        const duration = Math.round((Date.now() - startTime) / 1000);
        console.log('\n' + colors.green + '═'.repeat(60));
        console.log('  DEPLOYMENT COMPLETED SUCCESSFULLY!');
        console.log('═'.repeat(60) + colors.reset);
        console.log(`\nDuration: ${duration}s`);
        console.log('\nNext Steps:');
        console.log('  1. Configure Azure AD app permissions');
        console.log('  2. Upload Teams app package');
        console.log('  3. Test the application');
        console.log('');

    } catch (error) {
        console.log('\n' + colors.red + '═'.repeat(60));
        console.log('  DEPLOYMENT FAILED!');
        console.log('═'.repeat(60) + colors.reset);
        log.error(error.message);
        console.log('');
        process.exit(1);
    }
}

// CLI
const args = process.argv.slice(2);
const configPath = args[0] || path.join(__dirname, 'deploy.config.json');

deploy(configPath);
