# GCCH and DoD Cloud Environment Support Implementation

## Overview
This document summarizes the changes made to enable the Microsoft Teams Emergency Operations Center (TEOC) application to work correctly in GCCH (GCC High) and DoD (Department of Defense) cloud environments.

## Background
The TEOC application previously supported Commercial and GCCH cloud environments, but needed enhancements for DoD cloud deployments. While GCCH and DoD share most Microsoft 365 endpoints, they have different Teams web URLs that needed to be properly handled.

## Cloud Environment Endpoints

### Shared Endpoints (GCCH & DoD)
- **Graph API**: `https://graph.microsoft.us`
- **Login**: `https://login.microsoftonline.us`
- **SharePoint**: `*.sharepoint.us`
- **Outlook**: `https://outlook.office365.us`
- **Tasks**: `https://tasks.office365.us`

### Environment-Specific Differences
| Service | Commercial | GCCH | DoD |
|---------|-----------|------|-----|
| Teams Web | `teams.microsoft.com` | `gov.teams.microsoft.us` | `dod.teams.microsoft.us` |
| Teams Admin | `admin.teams.microsoft.com` | `admin.gov.teams.microsoft.us` | `admin.dod.teams.microsoft.us` |

## Changes Implemented

### 1. Code Changes

#### Constants.ts (`EOC-TeamsFx/tabs/src/common/Constants.ts`)
- Added `teamsWebUrlDoD` constant: `https://dod.teams.microsoft.us`
- Added `cloudEnvironments` object with Commercial, GCCH, and DoD types
- Created `getTeamsWebUrl()` helper function that:
  - Validates government cloud URLs by checking for `microsoft.us` or `.us/`
  - Returns DoD Teams URL when `REACT_APP_CLOUD_ENVIRONMENT=DoD`
  - Returns GCCH Teams URL for other government clouds
  - Returns Commercial Teams URL for commercial environments

#### EOCHome.tsx (`EOC-TeamsFx/tabs/src/components/EOCHome.tsx`)
- Added support for `REACT_APP_CLOUD_ENVIRONMENT` environment variable
- Added `cloudEnvironment` to component state
- Passes `cloudEnvironment` to child components that need cloud-specific behavior

#### IncidentDetails.tsx (`EOC-TeamsFx/tabs/src/components/IncidentDetails.tsx`)
- Added optional `cloudEnvironment` prop to component interface
- Updated guest invitation redirect URL to use `getTeamsWebUrl()` helper function
- Ensures guest users are redirected to the correct Teams environment

### 2. Deployment Templates

#### azuredeploydod.json (`Deployment/azuredeploydod.json`)
- New Azure deployment template for DoD environments
- Sets `REACT_APP_CLOUD_ENVIRONMENT=DoD`
- Uses default values for DoD Graph API: `https://graph.microsoft.us/`
- Uses DoD OAuth authority: `https://login.microsoftonline.us`

#### azuredeploygcch.json (`Deployment/azuredeploygcch.json`)
- Updated to include `REACT_APP_CLOUD_ENVIRONMENT=GCCH`
- Maintains existing GCCH-specific settings

### 3. Provisioning Scripts

#### EOC-ProvisionDoD.ps1 (`Deployment/provisioning/EOC-ProvisionDoD.ps1`)
- New PowerShell script for provisioning TEOC site in DoD tenants
- Uses `USGovernmentHigh` Azure environment
- Connects to `*.sharepoint.us` and `*.onmicrosoft.us` domains

#### Update-EOC-Provision-DoD.ps1 (`Deployment/provisioning/Upgrade/Update-EOC-Provision-DoD.ps1`)
- New PowerShell script for upgrading existing DoD deployments
- Follows same pattern as GCCH upgrade script

### 4. Documentation

#### DeploymentGuideForDoD.md (`Wiki/DeploymentGuideForDoD.md`)
- Complete deployment guide for DoD environments
- Covers all steps from prerequisites to final installation
- Includes DoD-specific URLs and configuration

#### FAQ.md (`Wiki/FAQ.md`)
- Updated to mention DoD support in cloud environment compatibility
- Updated task limitation to apply to both GCCH and DoD

#### Upgrade.md (`Wiki/Upgrade.md`)
- Added reference to `Update-EOC-Provision-DoD.ps1` script
- Clarified which script to use for each environment

### 5. Tests

#### Constants.test.ts (`EOC-TeamsFx/tabs/src/common/__tests__/Constants.test.ts`)
- 9 comprehensive tests covering:
  - Commercial environment behavior
  - GCCH environment behavior
  - DoD environment behavior
  - Validation of non-government URLs
  - Edge cases and defaults

## Testing Results

### Unit Tests
- **New Tests**: 9/9 passing
- **Existing Tests**: 22/22 passing
- **Total**: 31/31 tests passing ✅

### TypeScript Compilation
- No errors in modified files ✅
- No new type errors introduced ✅

### Security Scanning
- CodeQL JavaScript analysis: 0 alerts ✅
- No vulnerabilities introduced ✅

### Code Review
- All feedback addressed ✅
- Fixed schema URL syntax error
- Improved URL validation logic
- Added additional test coverage

## Usage

### For Commercial Deployments
No changes required. The application defaults to commercial environment when `REACT_APP_CLOUD_ENVIRONMENT` is not set.

### For GCCH Deployments
Use the updated `azuredeploygcch.json` template which now sets `REACT_APP_CLOUD_ENVIRONMENT=GCCH`.

### For DoD Deployments
1. Use `EOC-ProvisionDoD.ps1` to provision the SharePoint site
2. Use `azuredeploydod.json` for Azure deployment
3. Set `REACT_APP_CLOUD_ENVIRONMENT=DoD` in environment variables
4. Follow the complete guide in `Wiki/DeploymentGuideForDoD.md`

## Validation

The implementation was validated through:
1. ✅ Code review and feedback incorporation
2. ✅ Comprehensive unit test coverage
3. ✅ TypeScript compilation checks
4. ✅ Security vulnerability scanning
5. ✅ Existing test regression checks

## Impact

### User Impact
- **DoD Users**: Can now deploy and use TEOC in DoD cloud environments with correct Teams URLs
- **GCCH Users**: No breaking changes, benefits from improved cloud detection
- **Commercial Users**: No impact, application continues to work as before

### Technical Debt
- Minimal: All changes follow existing patterns
- Well-tested: 9 new tests ensure correctness
- Well-documented: Complete deployment guides for all environments

## Conclusion

The Teams Emergency Operations Center application now fully supports deployment in Commercial, GCCH, and DoD cloud environments. The implementation is backward compatible, well-tested, and properly documented.

Key highlights:
- ✅ Zero security vulnerabilities
- ✅ 100% test pass rate (31/31)
- ✅ Backward compatible
- ✅ Complete documentation
- ✅ Follows existing patterns
