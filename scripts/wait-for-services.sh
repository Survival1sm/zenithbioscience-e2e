#!/bin/bash
# Wait for E2E test services to be ready
# This script polls the backend and frontend health endpoints until they respond
# or until the timeout is reached.
#
# Usage:
#   ./wait-for-services.sh
#   BACKEND_URL=http://localhost:8080 FRONTEND_URL=http://localhost:3000 TIMEOUT=120 ./wait-for-services.sh
#
# Environment Variables:
#   BACKEND_URL  - Backend API URL (default: http://localhost:8080)
#   FRONTEND_URL - Frontend URL (default: http://localhost:3000)
#   TIMEOUT      - Maximum wait time in seconds (default: 120)
#
# Exit Codes:
#   0 - Both services are ready
#   1 - Timeout reached before services became ready
#
# Note: Make this script executable with: chmod +x wait-for-services.sh

set -e

# Configuration with defaults
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TIMEOUT="${TIMEOUT:-120}"
POLL_INTERVAL="${POLL_INTERVAL:-2}"

# Colors for output (if terminal supports it)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m' # No Color
else
    RED=''
    GREEN=''
    YELLOW=''
    NC=''
fi

# Print colored status messages
print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Wait for a service to be ready
# Arguments:
#   $1 - Service name (for logging)
#   $2 - URL to poll
#   $3 - Remaining timeout in seconds
# Returns:
#   0 - Service is ready
#   1 - Timeout reached
wait_for_service() {
    local service_name="$1"
    local url="$2"
    local remaining_timeout="$3"
    local start_time=$(date +%s)
    local elapsed=0

    print_info "Waiting for $service_name at $url (timeout: ${remaining_timeout}s)..."

    while [ $elapsed -lt $remaining_timeout ]; do
        # Try to reach the service
        if curl --silent --fail --max-time 5 "$url" > /dev/null 2>&1; then
            print_success "$service_name is ready! (took ${elapsed}s)"
            return 0
        fi

        # Calculate elapsed time
        local current_time=$(date +%s)
        elapsed=$((current_time - start_time))

        # Print progress every few attempts
        if [ $((elapsed % 10)) -eq 0 ] && [ $elapsed -gt 0 ]; then
            print_info "$service_name not ready yet... (${elapsed}s elapsed)"
        fi

        # Wait before next poll
        sleep $POLL_INTERVAL
    done

    print_error "$service_name failed to become ready within ${remaining_timeout}s"
    return 1
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    echo "========================================"
    echo "  E2E Services Health Check"
    echo "========================================"
    echo ""
    print_info "Backend URL:  $BACKEND_URL"
    print_info "Frontend URL: $FRONTEND_URL"
    print_info "Timeout:      ${TIMEOUT}s"
    echo ""

    # Wait for backend health endpoint
    local backend_health_url="${BACKEND_URL}/management/health"
    if ! wait_for_service "Backend" "$backend_health_url" "$TIMEOUT"; then
        print_error "Backend service did not become ready in time"
        exit 1
    fi

    # Calculate remaining timeout for frontend
    local current_time=$(date +%s)
    local elapsed=$((current_time - start_time))
    local remaining_timeout=$((TIMEOUT - elapsed))

    if [ $remaining_timeout -le 0 ]; then
        print_error "No time remaining for frontend check"
        exit 1
    fi

    # Wait for frontend
    if ! wait_for_service "Frontend" "$FRONTEND_URL" "$remaining_timeout"; then
        print_error "Frontend service did not become ready in time"
        exit 1
    fi

    # Final summary
    local total_time=$(($(date +%s) - start_time))
    echo ""
    echo "========================================"
    print_success "All services are ready! (total time: ${total_time}s)"
    echo "========================================"
    exit 0
}

# Run main function
main
