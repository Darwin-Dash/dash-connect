#!/bin/bash

echo "=== Mock Extension Test Runner ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run tests
run_tests() {
    echo -e "${YELLOW}Running unit tests for mock extension...${NC}"
    npm test -- src/test/mock-extension.test.ts
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Unit tests passed${NC}"
    else
        echo -e "${RED}✗ Unit tests failed${NC}"
        exit 1
    fi
}

# Function to test dev server with mock
test_dev_server() {
    echo ""
    echo -e "${YELLOW}Starting dev server with mock extension...${NC}"
    
    # Start dev server in background
    npm run dev:mock &
    DEV_PID=$!
    
    # Wait for server to start
    echo "Waiting for server to start..."
    sleep 5
    
    # Check if server is running
    if kill -0 $DEV_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Dev server started successfully${NC}"
        
        # Check if localhost is responding
        if curl -s http://localhost:5173 > /dev/null || curl -s http://localhost:5174 > /dev/null; then
            echo -e "${GREEN}✓ Server is responding${NC}"
        else
            echo -e "${RED}✗ Server not responding${NC}"
        fi
        
        # Kill the dev server
        kill $DEV_PID
        wait $DEV_PID 2>/dev/null
    else
        echo -e "${RED}✗ Dev server failed to start${NC}"
        exit 1
    fi
}

# Function to run Playwright tests
run_e2e_tests() {
    echo ""
    echo -e "${YELLOW}Running E2E tests with mock extension...${NC}"
    
    # Check if Playwright is installed
    if [ -f "playwright.config.ts" ]; then
        npm run test:e2e:mock
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ E2E tests passed${NC}"
        else
            echo -e "${RED}✗ E2E tests failed${NC}"
        fi
    else
        echo -e "${YELLOW}Playwright not configured, skipping E2E tests${NC}"
    fi
}

# Main execution
echo "Starting automated mock extension tests..."
echo ""

# Run unit tests
run_tests

# Test dev server
test_dev_server

# Run E2E tests if available
run_e2e_tests

echo ""
echo -e "${GREEN}=== All tests completed ===${NC}"