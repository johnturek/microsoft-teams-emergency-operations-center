#!/usr/bin/env pwsh
<#
.SYNOPSIS
    One-Click TEOC Deployment Orchestrator

.DESCRIPTION
    Automates the complete deployment of Microsoft Teams Emergency Operations Center including:
    - Azure AD App Registration
    - SharePoint Site Provisioning
    - Azure Resource Deployment
    - Teams App Packaging and Installation
    - SharePoint Extension Deployment

.PARAMETER ConfigFile
    Path to the deployment configuration JSON file

.PARAMETER SkipPreflightChecks
    Skip pre-flight validation checks

.PARAMETER WhatIf
    Show what would be deployed without actually deploying

.EXAMPLE
    .\Deploy-TEOC.ps1 -ConfigFile "deploy.config.json"

.EXAMPLE
    .\Deploy-TEOC.ps1 -ConfigFile "deploy.config.json" -WhatIf
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigFile,

    [Parameter(Mandatory = $false)]
    [switch]$SkipPreflightChecks,

    [Parameter(Mandatory = $false)]
    [switch]$WhatIf
)

# Script version
$ScriptVersion = "1.0.0"
$ErrorActionPreference = "Stop"

# Color output functions
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Step {
    param([string]$Message)
    Write-Host "`n🔷 $Message" -ForegroundColor Blue
}

# Banner
function Show-Banner {
    Write-Host @"

╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   Microsoft Teams Emergency Operations Center (TEOC)            ║
║   One-Click Deployment Script                                   ║
║   Version: $ScriptVersion                                             ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan
}

# Load configuration
function Get-DeploymentConfig {
    param([string]$Path)

    Write-Step "Loading deployment configuration from $Path"

    if (-not (Test-Path $Path)) {
        Write-Error-Custom "Configuration file not found: $Path"
        Write-Info "Please copy deploy.config.example.json to deploy.config.json and fill in your values"
        throw "Configuration file not found"
    }

    try {
        $config = Get-Content $Path -Raw | ConvertFrom-Json
        Write-Success "Configuration loaded successfully"
        return $config
    }
    catch {
        Write-Error-Custom "Failed to parse configuration file: $_"
        throw
    }
}

# Pre-flight checks
function Test-Prerequisites {
    Write-Step "Running pre-flight checks"

    $checks = @()

    # Check PowerShell version
    Write-Info "Checking PowerShell version..."
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        $checks += @{
            Name = "PowerShell Version"
            Status = "FAIL"
            Message = "PowerShell 7.x or higher required. Current: $($PSVersionTable.PSVersion)"
        }
    }
    else {
        $checks += @{
            Name = "PowerShell Version"
            Status = "PASS"
            Message = "PowerShell $($PSVersionTable.PSVersion)"
        }
    }

    # Check Azure CLI
    Write-Info "Checking Azure CLI..."
    try {
        $azVersion = az version --output json | ConvertFrom-Json
        $checks += @{
            Name = "Azure CLI"
            Status = "PASS"
            Message = "Version $($azVersion.'azure-cli')"
        }
    }
    catch {
        $checks += @{
            Name = "Azure CLI"
            Status = "FAIL"
            Message = "Azure CLI not found. Install from https://aka.ms/install-azure-cli"
        }
    }

    # Check PnP PowerShell
    Write-Info "Checking PnP.PowerShell module..."
    $pnpModule = Get-Module -ListAvailable -Name PnP.PowerShell | Sort-Object Version -Descending | Select-Object -First 1
    if ($null -eq $pnpModule) {
        $checks += @{
            Name = "PnP.PowerShell"
            Status = "WARN"
            Message = "Module not installed. Will attempt to install during deployment"
        }
    }
    elseif ([version]$pnpModule.Version -lt [version]"2.12.0") {
        $checks += @{
            Name = "PnP.PowerShell"
            Status = "WARN"
            Message = "Version $($pnpModule.Version) found. Version 2.12.0+ recommended"
        }
    }
    else {
        $checks += @{
            Name = "PnP.PowerShell"
            Status = "PASS"
            Message = "Version $($pnpModule.Version)"
        }
    }

    # Check Node.js (for Teams app packaging)
    Write-Info "Checking Node.js..."
    try {
        $nodeVersion = node --version
        $checks += @{
            Name = "Node.js"
            Status = "PASS"
            Message = "Version $nodeVersion"
        }
    }
    catch {
        $checks += @{
            Name = "Node.js"
            Status = "WARN"
            Message = "Node.js not found. Required for Teams app packaging"
        }
    }

    # Display results
    Write-Host "`nPre-flight Check Results:" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

    $failed = 0
    $warned = 0

    foreach ($check in $checks) {
        $statusColor = switch ($check.Status) {
            "PASS" { "Green" }
            "WARN" { "Yellow" }
            "FAIL" { "Red" }
        }

        $statusSymbol = switch ($check.Status) {
            "PASS" { "✅" }
            "WARN" { "⚠️ " }
            "FAIL" { "❌" }
        }

        Write-Host "$statusSymbol $($check.Name): " -NoNewline
        Write-Host $check.Message -ForegroundColor $statusColor

        if ($check.Status -eq "FAIL") { $failed++ }
        if ($check.Status -eq "WARN") { $warned++ }
    }

    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

    if ($failed -gt 0) {
        Write-Error-Custom "Pre-flight checks failed. Please fix the issues above and try again."
        return $false
    }

    if ($warned -gt 0) {
        Write-Warning-Custom "$warned warning(s) found. Deployment may continue but some features might not work."
    }

    Write-Success "Pre-flight checks completed successfully"
    return $true
}

# Azure login
function Connect-ToAzure {
    param([string]$SubscriptionId)

    Write-Step "Connecting to Azure"

    try {
        # Check if already logged in
        $context = az account show --output json 2>$null | ConvertFrom-Json

        if ($null -ne $context) {
            Write-Info "Already logged in to Azure as $($context.user.name)"

            # Check if correct subscription
            if ($context.id -ne $SubscriptionId -and -not [string]::IsNullOrEmpty($SubscriptionId)) {
                Write-Info "Switching to subscription: $SubscriptionId"
                az account set --subscription $SubscriptionId
            }
        }
        else {
            Write-Info "Logging in to Azure..."
            az login

            if (-not [string]::IsNullOrEmpty($SubscriptionId)) {
                az account set --subscription $SubscriptionId
            }
        }

        $currentContext = az account show --output json | ConvertFrom-Json
        Write-Success "Connected to Azure subscription: $($currentContext.name)"

        return $currentContext
    }
    catch {
        Write-Error-Custom "Failed to connect to Azure: $_"
        throw
    }
}

# Create or update Azure AD app registration
function New-AzureADAppRegistration {
    param(
        [object]$Config,
        [string]$WebAppUrl
    )

    Write-Step "Creating/Updating Azure AD App Registration"

    $appName = $Config.azureAd.appName

    # Check if app already exists
    Write-Info "Checking if app '$appName' already exists..."
    $existingApp = az ad app list --display-name $appName --output json | ConvertFrom-Json

    if ($existingApp.Count -gt 0) {
        Write-Info "App already exists with ID: $($existingApp[0].appId)"
        $appId = $existingApp[0].appId
        $objectId = $existingApp[0].id
    }
    else {
        Write-Info "Creating new Azure AD app..."

        # Create the app
        $newApp = az ad app create `
            --display-name $appName `
            --sign-in-audience "AzureADMyOrg" `
            --output json | ConvertFrom-Json

        $appId = $newApp.appId
        $objectId = $newApp.id

        Write-Success "Created Azure AD app with ID: $appId"
    }

    # Update redirect URIs
    $redirectUris = @(
        "$WebAppUrl/auth-end",
        "$WebAppUrl/blank-auth-end",
        "$WebAppUrl"
    )

    Write-Info "Updating redirect URIs..."
    az ad app update `
        --id $objectId `
        --web-redirect-uris $redirectUris `
        --enable-access-token-issuance $true `
        --enable-id-token-issuance $true

    # Expose API
    Write-Info "Exposing API..."
    $apiUri = "api://$WebAppUrl/$appId"

    az ad app update `
        --id $objectId `
        --identifier-uris $apiUri

    # Add API permissions
    Write-Info "Adding Microsoft Graph API permissions..."

    # Required Graph permissions
    $graphPermissions = @(
        "e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope",  # User.Read
        "06da0dbc-49e2-44d2-8312-53f166ab848a=Scope",  # Directory.Read.All
        "7ab1d382-f21e-4acd-a863-ba3e13f7da61=Role",   # Directory.Read.All (Application)
        "df021288-bdef-4463-88db-98f22de89214=Role"    # User.Read.All (Application)
    )

    foreach ($permission in $graphPermissions) {
        az ad app permission add `
            --id $objectId `
            --api 00000003-0000-0000-c000-000000000000 `
            --api-permissions $permission
    }

    # Create client secret
    Write-Info "Creating client secret..."
    $secretName = "TEOC-Deploy-$(Get-Date -Format 'yyyyMMdd')"
    $secret = az ad app credential reset `
        --id $objectId `
        --append `
        --display-name $secretName `
        --years 2 `
        --output json | ConvertFrom-Json

    Write-Success "Azure AD app configured successfully"

    return @{
        AppId = $appId
        ObjectId = $objectId
        ClientSecret = $secret.password
        TenantId = $Config.azureAd.tenantId
    }
}

# Deploy Azure resources
function Deploy-AzureResources {
    param(
        [object]$Config,
        [object]$AppRegistration
    )

    Write-Step "Deploying Azure resources"

    $rgName = $Config.azure.resourceGroupName
    $location = $Config.azure.location

    # Create resource group if it doesn't exist
    Write-Info "Checking resource group: $rgName"
    $rg = az group show --name $rgName --output json 2>$null | ConvertFrom-Json

    if ($null -eq $rg) {
        Write-Info "Creating resource group: $rgName"
        az group create --name $rgName --location $location
        Write-Success "Resource group created"
    }
    else {
        Write-Info "Resource group already exists"
    }

    # Prepare template parameters
    $templateFile = Join-Path $PSScriptRoot "azuredeploy.json"

    $parameters = @{
        baseResourceName = $Config.azure.baseResourceName
        ClientId = $AppRegistration.AppId
        ClientSecret = $AppRegistration.ClientSecret
        TenantId = $AppRegistration.TenantId
        SharePointSiteName = $Config.sharepoint.siteName
        hostingPlanSku = $Config.azure.hostingPlanSku
        hostingPlanSize = $Config.azure.hostingPlanSize
        location = $location
    }

    # Create parameters file
    $paramFile = Join-Path $PSScriptRoot "deploy.parameters.temp.json"
    $parameterTemplate = @{
        '$schema' = "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#"
        contentVersion = "1.0.0.0"
        parameters = @{}
    }

    foreach ($key in $parameters.Keys) {
        $parameterTemplate.parameters[$key] = @{ value = $parameters[$key] }
    }

    $parameterTemplate | ConvertTo-Json -Depth 10 | Set-Content $paramFile

    Write-Info "Starting ARM template deployment..."
    Write-Info "This may take 5-10 minutes..."

    try {
        $deployment = az deployment group create `
            --resource-group $rgName `
            --template-file $templateFile `
            --parameters "@$paramFile" `
            --output json | ConvertFrom-Json

        Write-Success "Azure resources deployed successfully"

        # Clean up temp parameter file
        Remove-Item $paramFile -Force

        return $deployment
    }
    catch {
        Write-Error-Custom "Failed to deploy Azure resources: $_"
        if (Test-Path $paramFile) {
            Remove-Item $paramFile -Force
        }
        throw
    }
}

# Provision SharePoint site
function New-SharePointSite {
    param([object]$Config)

    Write-Step "Provisioning SharePoint site"

    # Check for PnP.PowerShell
    if (-not (Get-Module -ListAvailable -Name PnP.PowerShell)) {
        Write-Info "Installing PnP.PowerShell module..."
        Install-Module -Name PnP.PowerShell -Force -AllowClobber -Scope CurrentUser
    }

    Import-Module PnP.PowerShell

    $tenantUrl = "https://$($Config.azureAd.tenantName).sharepoint.com"
    $siteName = $Config.sharepoint.siteName
    $siteUrl = $siteName -replace " ", ""
    $fullSiteUrl = "$tenantUrl/sites/$siteUrl"

    Write-Info "Connecting to SharePoint tenant..."
    Connect-PnPOnline -Url $tenantUrl -Interactive -ClientId $Config.sharepoint.pnpClientId

    # Check if site exists
    Write-Info "Checking if site exists at: $fullSiteUrl"
    try {
        $site = Get-PnPTenantSite -Url $fullSiteUrl -ErrorAction SilentlyContinue

        if ($null -ne $site) {
            Write-Warning-Custom "Site already exists at $fullSiteUrl"
            $response = Read-Host "Do you want to update the existing site? (y/n)"
            if ($response -ne 'y') {
                Write-Info "Skipping SharePoint provisioning"
                return $fullSiteUrl
            }
        }
        else {
            Write-Info "Creating new SharePoint site..."
            New-PnPSite `
                -Type TeamSiteWithoutMicrosoft365Group `
                -Title $siteName `
                -Url $fullSiteUrl `
                -Owner $Config.sharepoint.adminEmail

            Write-Success "SharePoint site created"
        }
    }
    catch {
        Write-Error-Custom "Failed to check/create SharePoint site: $_"
        throw
    }

    # Apply site template
    Write-Info "Applying site template..."
    $templatePath = Join-Path $PSScriptRoot "provisioning\EOC-SiteTemplate.xml"

    Connect-PnPOnline -Url $fullSiteUrl -Interactive -ClientId $Config.sharepoint.pnpClientId
    Invoke-PnPSiteTemplate -Path $templatePath

    Write-Success "SharePoint site provisioned successfully"

    return $fullSiteUrl
}

# Package Teams app
function New-TeamsAppPackage {
    param(
        [object]$Config,
        [string]$WebAppUrl
    )

    Write-Step "Creating Teams app package"

    $manifestPath = Join-Path $PSScriptRoot "appPackage\manifest.json"
    $manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json

    # Update manifest with deployment values
    $manifest.version = "3.4.0"
    $manifest.webApplicationInfo.id = $Config.teams.appId
    $manifest.webApplicationInfo.resource = "api://$WebAppUrl/$($Config.teams.appId)"

    # Replace placeholders
    $manifestJson = $manifest | ConvertTo-Json -Depth 10
    $manifestJson = $manifestJson -replace "<<appDomain>>", $WebAppUrl
    $manifestJson = $manifestJson -replace "<<clientId>>", $Config.teams.appId
    $manifestJson = $manifestJson -replace "<<websiteUrl>>", "https://$WebAppUrl"

    # Create output directory
    $outputDir = Join-Path $PSScriptRoot "output"
    if (-not (Test-Path $outputDir)) {
        New-Item -ItemType Directory -Path $outputDir | Out-Null
    }

    $tempManifestPath = Join-Path $outputDir "manifest.json"
    $manifestJson | Set-Content $tempManifestPath

    # Create zip package
    $packagePath = Join-Path $outputDir "teoc-app.zip"

    Write-Info "Creating Teams app package..."

    $resourcesPath = Join-Path $PSScriptRoot "appPackage\resources"

    if (Test-Path $packagePath) {
        Remove-Item $packagePath -Force
    }

    Compress-Archive `
        -Path $tempManifestPath, "$resourcesPath\*" `
        -DestinationPath $packagePath `
        -Force

    Write-Success "Teams app package created: $packagePath"

    return $packagePath
}

# Main deployment orchestration
function Start-Deployment {
    param([string]$ConfigFile)

    $deploymentStart = Get-Date

    try {
        Show-Banner

        # Load configuration
        $config = Get-DeploymentConfig -Path $ConfigFile

        # Run pre-flight checks
        if (-not $SkipPreflightChecks) {
            if (-not (Test-Prerequisites)) {
                throw "Pre-flight checks failed"
            }
        }

        # Connect to Azure
        $azureContext = Connect-ToAzure -SubscriptionId $config.azure.subscriptionId

        # Step 1: Provision SharePoint if needed
        if (-not $config.deployment_options.skipSharePointProvisioning) {
            $sharePointUrl = New-SharePointSite -Config $config
            Write-Info "SharePoint site URL: $sharePointUrl"
        }

        # Step 2: Deploy Azure resources
        $webAppUrl = ""
        if (-not $config.deployment_options.skipAzureDeployment) {
            # First create app registration to get credentials
            $appReg = New-AzureADAppRegistration -Config $config -WebAppUrl "tempurl.azurewebsites.net"

            # Deploy Azure resources
            $deployment = Deploy-AzureResources -Config $config -AppRegistration $appReg

            # Get the actual web app URL
            $webAppName = "$($config.azure.baseResourceName)-app"
            $webApp = az webapp show --name $webAppName --resource-group $config.azure.resourceGroupName --output json | ConvertFrom-Json
            $webAppUrl = $webApp.defaultHostName

            # Update app registration with correct URL
            $appReg = New-AzureADAppRegistration -Config $config -WebAppUrl $webAppUrl

            Write-Success "Web App URL: https://$webAppUrl"
        }

        # Step 3: Package Teams app
        if (-not $config.deployment_options.skipTeamsAppPackaging) {
            $teamsPackage = New-TeamsAppPackage -Config $config -WebAppUrl $webAppUrl
            Write-Info "Teams app package ready for installation: $teamsPackage"
        }

        # Summary
        $deploymentEnd = Get-Date
        $duration = $deploymentEnd - $deploymentStart

        Write-Host "`n"
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  DEPLOYMENT COMPLETED SUCCESSFULLY!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "Deployment Summary:" -ForegroundColor Cyan
        Write-Host "  Duration: $($duration.ToString('mm\:ss'))" -ForegroundColor White
        Write-Host "  SharePoint Site: $sharePointUrl" -ForegroundColor White
        Write-Host "  Web App URL: https://$webAppUrl" -ForegroundColor White
        Write-Host "  Teams Package: $teamsPackage" -ForegroundColor White
        Write-Host ""
        Write-Host "Next Steps:" -ForegroundColor Yellow
        Write-Host "  1. Grant admin consent for API permissions in Azure Portal" -ForegroundColor White
        Write-Host "  2. Upload Teams app package to Teams admin center or directly to Teams" -ForegroundColor White
        Write-Host "  3. Configure any additional settings in the admin portal" -ForegroundColor White
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green

    }
    catch {
        Write-Host "`n"
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host "  DEPLOYMENT FAILED!" -ForegroundColor Red
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
        Write-Host ""
        Write-Error-Custom $_.Exception.Message
        Write-Host ""
        Write-Host "Check the error message above for details." -ForegroundColor Yellow
        Write-Host "You may need to clean up partially deployed resources." -ForegroundColor Yellow
        Write-Host ""

        throw
    }
}

# Entry point
if ($PSCmdlet.ShouldProcess("TEOC Deployment", "Deploy")) {
    Start-Deployment -ConfigFile $ConfigFile
}
else {
    Write-Info "WhatIf mode - no changes will be made"
    $config = Get-DeploymentConfig -Path $ConfigFile
    Write-Info "Would deploy with configuration:"
    $config | ConvertTo-Json -Depth 10
}
