# Codebase Cleanup Summary

## Files to Remove

### 1. Duplicate/Unnecessary Folder
- `smart-lms/` - This appears to be a duplicate or old folder with only one file

### 2. Test/Development Scripts (Server)
These are utility scripts used during development and testing:
- `server/check-course-content.js`
- `server/fix-platform-admin-password.js`
- `server/list-all-courses.js`
- `server/seed-platform-data.js`
- `server/test-course-detail-endpoint.js`
- `server/test-course-visibility.js`
- `server/test-instructor-complete.js`
- `server/test-student-endpoints.js`
- `server/verify-user-org.js`

### 3. Keep These Test Scripts (Useful for Production Testing)
- `server/create-platform-admin.js` - KEEP (needed for admin creation)
- `server/publish-test-course.js` - KEEP (useful for testing)
- `server/test-student-dashboard.js` - KEEP (useful for testing)
- `server/test-student-registration-flow.js` - KEEP (useful for testing)

### 4. Temporary/Status Files
- `ENDPOINT_STATUS.txt` - Old status tracking file

### 5. Client Setup Files (No Longer Needed)
- `client/setup-client.ps1` - Setup script no longer needed
- `client/FIX_CLIENT_SETUP.md` - Fix documentation no longer needed
- `client/pnpm-lock.yaml` - Using npm, not pnpm
- `client/next.config.mjs` - Duplicate config (we use next.config.js)

### 6. Root Package Files (Unnecessary)
- `package.json` - Root level package.json not needed
- `package-lock.json` - Root level lock file not needed
- `node_modules/` - Root level node_modules not needed

## Files to KEEP (Currently Open in Editor)

All files currently open in your editor will be preserved:
- All `.kiro/specs/` files
- `server/create-platform-admin.js`
- `server/publish-test-course.js`
- `server/test-student-dashboard.js`
- `server/.env`
- `client/.env.local`
- All application source files
- All configuration files (tsconfig.json, next.config.js, etc.)
- All documentation files created for production

## Cleanup Actions

The following will be removed:
1. smart-lms folder (duplicate/old)
2. Unnecessary test scripts
3. Temporary status files
4. Duplicate configuration files
5. Root-level package files
6. Client setup scripts

Total estimated space saved: ~50-100 MB (excluding node_modules)
