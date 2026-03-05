#!/bin/bash

# FEMA Disaster Daily Sync Script
# This script runs the FEMA sync and logs the results

# Set the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
mkdir -p logs

# Set up log file with timestamp
LOG_FILE="logs/sync-$(date +%Y-%m-%d).log"
ERROR_LOG="logs/sync-errors.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Starting FEMA Disaster Sync ==="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    log "ERROR: Node.js not found in PATH"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Node.js not found in PATH" >> "$ERROR_LOG"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    log "WARNING: .env file not found. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in environment"
fi

# Run the sync script and capture output
log "Running sync-seps.mjs..."
if node sync-seps.mjs >> "$LOG_FILE" 2>&1; then
    log "=== Sync completed successfully ==="
    
    # Optional: Clean up old log files (keep last 30 days)
    find logs -name "sync-*.log" -mtime +30 -delete 2>/dev/null
else
    log "ERROR: Sync failed with exit code $?"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: Sync failed - check $LOG_FILE" >> "$ERROR_LOG"
    exit 1
fi

log "=== Daily sync finished ===" 