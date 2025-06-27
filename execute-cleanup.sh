#!/bin/bash

# Cleanup script for dash-connect project
set -e

echo "Starting cleanup process..."

# Create test-archive directory
mkdir -p test-archive

# Move the 3 specified test files to test-archive
echo "Moving test files to archive..."
mv test-read-documents-debug.html test-archive/ 2>/dev/null || echo "test-read-documents-debug.html not found or already moved"
mv test-extension-with-broadcast.html test-archive/ 2>/dev/null || echo "test-extension-with-broadcast.html not found or already moved"
mv test-extension-debug-identity.html test-archive/ 2>/dev/null || echo "test-extension-debug-identity.html not found or already moved"

# Remove redundant test HTML files
echo "Removing redundant test HTML files..."
rm -f test-extension-final-solution.html
rm -f test-extension-minimal.html
rm -f test-extension-publish-integrated.html
rm -f test-extension-publish-queue.html
rm -f test-extension-publish-retry.html
rm -f test-extension-publish.html
rm -f test-extension-simple-fix.html
rm -f test-extension.html
rm -f test-read-documents.html

# Remove backup files
echo "Removing backup files..."
rm -f test-extension-publish.html.backup
rm -f test-extension-publish.html.backup-before-retry

# Remove redundant JavaScript test files
echo "Removing redundant JavaScript files..."
rm -f analyze-sdk-contract.js
rm -f copy-contract-test.js
rm -f copy-data-contract.js
rm -f create-contract-final.js
rm -f create-contract-wasm.js
rm -f test-extension-fix.js
rm -f verify-buffer-fix.js

# Remove duplicate library files
echo "Removing duplicate library files..."
rm -f src/lib/dash-service-fixed.ts
rm -f src/lib/mock-sdk.ts

# Remove redundant E2E tests
echo "Removing redundant E2E tests..."
rm -f e2e/basic.spec.ts
rm -f e2e/browser-compat.spec.ts
rm -f e2e/extension-adapter.spec.ts
rm -f e2e/extension-integration.spec.ts
rm -f e2e/extension-publish.spec.ts
rm -f e2e/extension.spec.ts

# Remove documentation artifacts
echo "Removing documentation artifacts..."
rm -f CONTRACT_CREATION_SUMMARY.md
rm -f EXTENSION_FIX_SUMMARY.md
rm -f IMPROVEMENTS_SUMMARY.md
rm -f TEST_CLEANUP_ACTIONS.md
rm -f COMMIT_COMMAND.md
rm -f verify-fix.md

# Remove temporary scripts
echo "Removing temporary scripts..."
rm -f cleanup-tests.sh
rm -f commit-audit-work.sh

# Remove integration test
echo "Removing skipped integration test..."
rm -f src/lib/dash-service.integration.test.ts

# Remove additional redundant files found
echo "Removing additional redundant files..."
rm -f test-contract-params.js
rm -f test-blockchain-publish.js
rm -f test-extension-integration.js
rm -f dash-extension-utils.js
rm -f copy-contract-extension.html
rm -f copy-data-contract.html
rm -f debug-sdk.html
rm -f diagnose-extension.sh

echo "Cleanup complete!"
echo ""
echo "Summary:"
echo "- Created test-archive/ directory"
echo "- Moved 3 test files to archive"
echo "- Removed 34+ redundant files"
echo ""
echo "You can now run 'ls -la' to see the cleaned structure"