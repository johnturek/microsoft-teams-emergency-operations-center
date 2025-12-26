# Dependency Update Notes

## Critical Security Updates - December 26, 2025

The following critical dependencies have been updated to address security vulnerabilities:

### Updated Packages

1. **@microsoft/teamsfx**: `2.1.0` → `^4.0.2`
   - Fixes Azure Identity vulnerability (GHSA-m5vv-6r4h-3vj9)
   - Addresses MSAL node security issues
   - **Breaking Change**: May require code changes in authentication flows
   - Review: https://github.com/OfficeDev/TeamsFx/releases

2. **axios**: `^0.21.1` → `^1.6.0`
   - Multiple critical security vulnerabilities fixed
   - **Breaking Change**: API changes in request/response interceptors
   - Migration guide: https://github.com/axios/axios/blob/v1.x/MIGRATION_GUIDE.md

3. **@azure/identity**: Added override to `^4.2.1`
   - Fixes elevation of privilege vulnerability
   - Ensures all transitive dependencies use secure version

4. **@babel/helpers**: Added to devDependencies at `^7.26.10`
   - Fixes RegEx complexity vulnerability (GHSA-968p-4wvh-cqc8)

## Testing Required

After running `npm install`, the following areas should be tested:

### 1. Authentication Flows
- [ ] User login/logout
- [ ] Token acquisition and refresh
- [ ] Single sign-on (SSO)
- [ ] Guest user authentication

### 2. Graph API Calls
- [ ] All Microsoft Graph API operations
- [ ] Error handling and retries
- [ ] Token usage in headers

### 3. HTTP Requests (axios)
- [ ] All REST API calls
- [ ] Request/response interceptors (if any)
- [ ] Error handling
- [ ] Timeouts and cancellation

## Installation Instructions

```bash
cd EOC-TeamsFx/tabs
npm install
npm audit
npm run build
npm test
```

## Known Issues

### TeamsFx v4 Breaking Changes
- Authentication token acquisition may require code updates
- Check for deprecated methods in:
  - `src/components/Context.tsx`
  - Any files using `TeamsFxContext`

### Axios v1 Breaking Changes
- `axios.get(url, { params })` syntax unchanged
- Error response structure may differ slightly
- Check error handling in:
  - `src/common/CommonService.ts`
  - Any components making direct axios calls

## Rollback Plan

If critical issues are encountered:

1. Revert package.json changes:
```bash
git checkout HEAD^ -- package.json
npm install
```

2. Alternative: Pin to intermediate versions
```json
{
  "@microsoft/teamsfx": "3.0.0",
  "axios": "1.0.0"
}
```

## Next Steps

1. Run full test suite after installation
2. Perform manual testing of authentication flows
3. Monitor Application Insights for errors after deployment
4. Consider staged rollout (dev → staging → production)

## Additional Updates Recommended

The following packages should be updated in a future iteration:

- **react**: `16.14.0` → `18.x` (Major version, requires planning)
- **typescript**: `4.1.2` → `5.x` (Test compatibility first)
- **moment**: Consider migrating to `date-fns` (smaller bundle)

## References

- [TeamsFx Release Notes](https://github.com/OfficeDev/TeamsFx/releases)
- [Axios Migration Guide](https://github.com/axios/axios/blob/v1.x/MIGRATION_GUIDE.md)
- [Azure Identity Security Advisory](https://github.com/advisories/GHSA-m5vv-6r4h-3vj9)
- [npm audit documentation](https://docs.npmjs.com/cli/v9/commands/npm-audit)

---

**Last Updated**: December 26, 2025
**Updated By**: Code Review Process
**Status**: ⚠️ Requires Testing
