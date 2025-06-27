#!/bin/bash

# Comprehensive test runner for all test types
set -e

echo "🧪 Starting comprehensive test suite..."
echo "======================================"

# Kill any existing servers
echo "🔄 Cleaning up existing processes..."
pkill -f "vite" || true
sleep 2

# Run unit tests
echo ""
echo "1️⃣ Running unit tests..."
echo "------------------------"
npm test -- --run
if [ $? -eq 0 ]; then
    echo "✅ Unit tests passed!"
else
    echo "❌ Unit tests failed!"
    exit 1
fi

# Start dev server in background for E2E tests
echo ""
echo "2️⃣ Starting dev server for E2E tests..."
echo "---------------------------------------"
VITE_USE_MOCK_EXTENSION=true npm run dev > /dev/null 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to be ready
echo "Waiting for server to be ready..."
until curl -s http://localhost:5173 > /dev/null; do
    sleep 1
done
echo "✅ Server is ready!"

# Run E2E tests
echo ""
echo "3️⃣ Running E2E tests..."
echo "----------------------"

# Install Playwright browsers if needed
if [ ! -d "$HOME/Library/Caches/ms-playwright" ]; then
    echo "Installing Playwright browsers..."
    npx playwright install chromium
fi

# Run browser compatibility tests
echo ""
echo "Testing browser compatibility..."
npx playwright test e2e/browser-compat.spec.ts --reporter=list
if [ $? -eq 0 ]; then
    echo "✅ Browser compatibility tests passed!"
else
    echo "❌ Browser compatibility tests failed!"
    kill $SERVER_PID
    exit 1
fi

# Run full UI tests
echo ""
echo "Testing full UI functionality..."
npx playwright test e2e/full-ui.spec.ts --reporter=list
if [ $? -eq 0 ]; then
    echo "✅ Full UI tests passed!"
else
    echo "❌ Full UI tests failed!"
    kill $SERVER_PID
    exit 1
fi

# Run mock extension tests
echo ""
echo "Testing mock extension..."
npx playwright test e2e/mock-extension.spec.ts --reporter=list
if [ $? -eq 0 ]; then
    echo "✅ Mock extension tests passed!"
else
    echo "❌ Mock extension tests failed!"
    kill $SERVER_PID
    exit 1
fi

# Run visual regression tests (optional)
if [ "$1" == "--visual" ]; then
    echo ""
    echo "4️⃣ Running visual regression tests..."
    echo "------------------------------------"
    npx playwright test e2e/visual.spec.ts --reporter=list
    if [ $? -eq 0 ]; then
        echo "✅ Visual tests passed!"
    else
        echo "⚠️  Visual tests failed (this might be expected if screenshots changed)"
    fi
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null || true

# Summary
echo ""
echo "======================================"
echo "✨ All tests completed successfully!"
echo "======================================"
echo ""
echo "Test Summary:"
echo "- ✅ Unit tests: PASSED"
echo "- ✅ Browser compatibility: PASSED"
echo "- ✅ Full UI tests: PASSED"
echo "- ✅ Mock extension: PASSED"
if [ "$1" == "--visual" ]; then
    echo "- ✅ Visual regression: COMPLETED"
fi
echo ""
echo "The interface has been fully tested in an automated way!"