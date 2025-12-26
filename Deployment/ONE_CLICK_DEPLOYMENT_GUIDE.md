# TEOC One-Click Deployment Guide

## 🚀 Quick Start

Deploy Microsoft Teams Emergency Operations Center in under 30 minutes with our automated deployment scripts!

### Prerequisites

Before you begin, ensure you have:

- ✅ **Azure Subscription** with contributor access
- ✅ **Global Administrator** or **Application Administrator** role in Azure AD
- ✅ **SharePoint Administrator** role for site provisioning
- ✅ **PowerShell 7.x+** (Windows, macOS, Linux) - [Download](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
- ✅ **Azure CLI** - [Install](https://aka.ms/install-azure-cli)
- ✅ **Node.js 14+** and npm - [Download](https://nodejs.org/)
- ✅ **Git** (optional) - [Download](https://git-scm.com/)

### Quick Install Script

**Option 1: PowerShell (Recommended for Windows)**
```powershell
# Clone repository
git clone https://github.com/OfficeDev/microsoft-teams-emergency-operations-center.git
cd microsoft-teams-emergency-operations-center/Deployment

# Copy and configure
cp deploy.config.example.json deploy.config.json
# Edit deploy.config.json with your values

# Run deployment
./Deploy-TEOC.ps1 -ConfigFile deploy.config.json
```

**Option 2: Node.js (Cross-platform)**
```bash
# Clone repository
git clone https://github.com/OfficeDev/microsoft-teams-emergency-operations-center.git
cd microsoft-teams-emergency-operations-center/Deployment

# Install dependencies
npm install

# Copy and configure
cp deploy.config.example.json deploy.config.json
# Edit deploy.config.json with your values

# Run deployment
node deploy.js deploy.config.json
```

---

## 📋 Detailed Setup

### Step 1: Prepare Configuration File

1. **Copy the example configuration:**
   ```bash
   cp deploy.config.example.json deploy.config.json
   ```

2. **Edit `deploy.config.json`** with your organization's details:

#### Required Settings

```json
{
  "azure": {
    "subscriptionId": "YOUR-AZURE-SUBSCRIPTION-ID",
    "resourceGroupName": "rg-teoc-prod",
    "baseResourceName": "teoc",
    "location": "eastus"
  },
  "azureAd": {
    "tenantId": "YOUR-TENANT-ID",
    "tenantName": "yourcompany",
    "appName": "Teams EOC Application"
  },
  "sharepoint": {
    "siteName": "Teams EOC",
    "adminEmail": "admin@yourcompany.com",
    "pnpClientId": "LEAVE-EMPTY-WILL-BE-CREATED"
  }
}
```

#### Finding Your Values

- **Subscription ID**: Azure Portal → Subscriptions → Copy Subscription ID
- **Tenant ID**: Azure Portal → Azure Active Directory → Overview → Tenant ID
- **Tenant Name**: Your organization's SharePoint URL: `https://TENANTNAME.sharepoint.com`
- **Admin Email**: Email of user with SharePoint Admin rights

### Step 2: Pre-Deployment Checklist

Run the pre-flight check script to verify your environment:

```powershell
# PowerShell
./Deploy-TEOC.ps1 -ConfigFile deploy.config.json -WhatIf

# Node.js
node deploy.js deploy.config.json --dry-run
```

This will check for:
- ✅ Required software installed
- ✅ Azure CLI logged in
- ✅ Correct permissions
- ✅ Configuration file valid

### Step 3: Run Deployment

#### Full Deployment (Recommended)

Deploy everything in one command:

```powershell
./Deploy-TEOC.ps1 -ConfigFile deploy.config.json
```

The script will:
1. ✅ Connect to Azure
2. ✅ Create Azure AD app registration
3. ✅ Provision SharePoint site and lists
4. ✅ Deploy Azure resources (App Service, Application Insights)
5. ✅ Build and deploy web application
6. ✅ Create Teams app package
7. ✅ Provide installation instructions

**Estimated time:** 15-30 minutes

#### Partial Deployment

Skip certain steps if already completed:

```json
{
  "deployment_options": {
    "skipSharePointProvisioning": false,
    "skipAzureADAppRegistration": false,
    "skipAzureDeployment": false,
    "skipTeamsAppPackaging": false
  }
}
```

### Step 4: Post-Deployment Configuration

After deployment completes:

#### 1. Grant API Permissions

```powershell
# The script will display the app registration link
# Click "Grant admin consent" in Azure Portal
```

**Manual steps:**
1. Go to Azure Portal → Azure Active Directory → App registrations
2. Find "Teams EOC Application"
3. Click "API permissions"
4. Click "Grant admin consent for [Your Org]"
5. Confirm

#### 2. Install Teams App

The deployment creates a Teams app package at `Deployment/output/teoc-app.zip`

**Option A: Admin Center (Recommended)**
1. Go to [Teams Admin Center](https://admin.teams.microsoft.com)
2. Navigate to Teams apps → Manage apps
3. Click "Upload new app" → Upload `teoc-app.zip`
4. Approve the app
5. Create a setup policy to auto-install for users

**Option B: Direct Upload**
1. Open Microsoft Teams
2. Click Apps → Manage your apps
3. Click "Upload an app" → "Upload a custom app"
4. Select `teoc-app.zip`
5. Click "Add"

#### 3. Verify Installation

1. Open Teams
2. Search for "TEOC" in the app search
3. Click the app and add to a team or use personally
4. Verify the dashboard loads correctly

---

## 🔧 Advanced Configuration

### Custom Domains

To use a custom domain instead of `*.azurewebsites.net`:

```json
{
  "advanced": {
    "customDomain": "teoc.yourcompany.com",
    "certificateThumbprint": "YOUR-CERT-THUMBPRINT"
  }
}
```

### Azure Maps Integration

Enable location mapping features:

```json
{
  "features": {
    "azureMaps": true,
    "azureMapsKey": "YOUR-AZURE-MAPS-KEY"
  }
}
```

### Application Insights

Monitor your deployment (enabled by default):

```json
{
  "features": {
    "applicationInsights": true
  }
}
```

### Different Environments

Deploy to multiple environments:

```bash
# Development
./Deploy-TEOC.ps1 -ConfigFile deploy.dev.config.json

# Staging
./Deploy-TEOC.ps1 -ConfigFile deploy.staging.config.json

# Production
./Deploy-TEOC.ps1 -ConfigFile deploy.prod.config.json
```

---

## 🐛 Troubleshooting

### Common Issues

#### "PowerShell execution policy prevents running scripts"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### "Azure CLI not found"

```bash
# Install Azure CLI
# Windows: Download from https://aka.ms/install-azure-cli
# macOS: brew install azure-cli
# Linux: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

#### "PnP PowerShell module not found"

```powershell
Install-Module -Name PnP.PowerShell -Force -AllowClobber -Scope CurrentUser
```

#### "SharePoint site already exists"

The script will prompt to update the existing site. To force recreation:

```powershell
# Manually delete site first
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com" -Interactive
Remove-PnPTenantSite -Url "https://yourtenant.sharepoint.com/sites/TeamsEOC" -Force
```

#### "Azure deployment failed"

Check Azure Portal → Resource Groups → Deployments for detailed error messages.

Common fixes:
- Ensure resource group name doesn't already exist
- Verify subscription has enough quota
- Check resource names are globally unique

#### "Teams app won't load"

1. Check Application Insights for errors
2. Verify Azure AD app has correct redirect URIs
3. Ensure admin consent was granted
4. Check SharePoint site permissions

### Getting Help

1. **Check logs:**
   - PowerShell: Deployment logs are shown in console
   - Azure: Portal → Resource Group → Deployments → View details
   - Application Insights: Portal → Application Insights → Failures

2. **Enable debug mode:**
   ```powershell
   $DebugPreference = "Continue"
   ./Deploy-TEOC.ps1 -ConfigFile deploy.config.json -Verbose
   ```

3. **Review documentation:**
   - [Full Deployment Guide](../Wiki/DeploymentGuide.md)
   - [Troubleshooting Guide](../Wiki/Troubleshooting.md)
   - [Architecture Overview](../Wiki/Architecture.md)

4. **Report issues:**
   - GitHub Issues: https://github.com/OfficeDev/microsoft-teams-emergency-operations-center/issues

---

## 🔄 Update / Redeploy

To update an existing deployment:

1. **Pull latest code:**
   ```bash
   git pull origin main
   ```

2. **Rebuild and redeploy:**
   ```powershell
   ./Deploy-TEOC.ps1 -ConfigFile deploy.config.json
   ```

   The script will:
   - Skip creating resources that already exist
   - Update existing resources
   - Deploy latest application code

3. **Update Teams app:**
   - Upload the new `teoc-app.zip` to Teams admin center
   - Version number will be incremented automatically

---

## 🗑️ Cleanup / Uninstall

To remove all deployed resources:

```powershell
# Remove resource group (includes all Azure resources)
az group delete --name rg-teoc-prod --yes --no-wait

# Remove SharePoint site
Connect-PnPOnline -Url "https://yourtenant.sharepoint.com" -Interactive
Remove-PnPTenantSite -Url "https://yourtenant.sharepoint.com/sites/TeamsEOC" -Force

# Remove Azure AD app registration
az ad app delete --id YOUR-APP-ID

# Remove Teams app
# Teams Admin Center → Manage apps → Find TEOC → Delete
```

---

## 📊 Deployment Checklist

Use this checklist to track your deployment progress:

- [ ] Prerequisites installed (PowerShell 7, Azure CLI, Node.js)
- [ ] Configuration file created and filled out
- [ ] Pre-flight checks passed
- [ ] Azure login successful
- [ ] SharePoint site provisioned
- [ ] Azure AD app registered
- [ ] Azure resources deployed
- [ ] Web application built and deployed
- [ ] Teams app package created
- [ ] API permissions granted (admin consent)
- [ ] Teams app uploaded and approved
- [ ] Teams app tested and working
- [ ] Users trained on how to use TEOC
- [ ] Monitoring configured (Application Insights)

---

## 🎯 What Gets Deployed

### Azure Resources

| Resource | Type | Purpose |
|----------|------|---------|
| App Service Plan | Standard S2 | Hosts the web application |
| App Service | Web App | Runs the TEOC React application |
| Application Insights | Monitoring | Tracks usage, errors, performance |
| Storage Account | Storage | Stores app data and logs |

**Estimated monthly cost:** $100-200 USD (varies by usage)

### SharePoint

| Component | Description |
|-----------|-------------|
| Team Site | Container for all TEOC lists |
| Incidents List | Stores incident data |
| Incident Status List | Available statuses |
| Incident Types List | Available incident types |
| Role Assignment List | Team roles |
| Config Settings List | Application settings |
| TEOC Tasks List | Default tasks templates |

### Azure AD

| Component | Description |
|-----------|-------------|
| App Registration | Authentication and API access |
| API Permissions | Microsoft Graph access |
| Client Secret | Application credentials |

### Teams App

| Feature | Description |
|---------|-------------|
| Personal Tab | Dashboard for individual users |
| Configurable Tab | Team-specific incident management |
| Static Tab | Main TEOC interface |

---

## 🔐 Security Best Practices

1. **Secure configuration file:**
   ```bash
   # Never commit deploy.config.json
   echo "deploy.config.json" >> .gitignore
   ```

2. **Rotate secrets regularly:**
   - Client secrets expire in 2 years
   - Set calendar reminder to rotate

3. **Use managed identities:**
   - Enable for App Service
   - Reduces need for stored secrets

4. **Enable monitoring:**
   - Application Insights captures errors
   - Set up alerts for failures

5. **Review permissions:**
   - Grant least-privilege access
   - Regular access reviews

---

## 📞 Support

- **Documentation:** [GitHub Wiki](https://github.com/OfficeDev/microsoft-teams-emergency-operations-center/wiki)
- **Issues:** [GitHub Issues](https://github.com/OfficeDev/microsoft-teams-emergency-operations-center/issues)
- **Community:** Microsoft Tech Community

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Last Updated:** December 26, 2025
**Script Version:** 1.0.0
**Tested On:** PowerShell 7.4, Azure CLI 2.55, Node.js 18+
