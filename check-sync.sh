#!/bin/bash

# Monitor FEMA Disaster Sync Status

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
LOGS_DIR="$SCRIPT_DIR/logs"

echo "🔍 FEMA Disaster Sync Status Monitor"
echo "==================================="

# Check if logs directory exists
if [ ! -d "$LOGS_DIR" ]; then
    echo "❌ No logs directory found. Have you run the sync yet?"
    exit 1
fi

# Show cron job status
echo "📅 Cron Job Status:"
if crontab -l 2>/dev/null | grep -q "daily-sync.sh"; then
    echo "✅ Daily sync is scheduled:"
    crontab -l | grep "daily-sync.sh"
else
    echo "❌ No daily sync scheduled. Run ./setup-cron.sh to set it up."
fi

echo ""

# Show recent log files
echo "📁 Recent Sync Logs:"
if ls "$LOGS_DIR"/sync-*.log >/dev/null 2>&1; then
    ls -lt "$LOGS_DIR"/sync-*.log | head -5 | while read line; do
        echo "   $line"
    done
else
    echo "   No sync logs found."
fi

echo ""

# Show latest sync status
LATEST_LOG=$(ls -t "$LOGS_DIR"/sync-*.log 2>/dev/null | head -1)
if [ -n "$LATEST_LOG" ]; then
    echo "📊 Latest Sync Results:"
    echo "   Log file: $(basename "$LATEST_LOG")"
    
    if grep -q "Sync completed successfully" "$LATEST_LOG"; then
        echo "   Status: ✅ SUCCESS"
        # Extract number of disasters synced
        DISASTERS=$(grep "active disasters added/updated" "$LATEST_LOG" | tail -1 | sed 's/.*: \([0-9]*\) active.*/\1/')
        if [ -n "$DISASTERS" ]; then
            echo "   Disasters synced: $DISASTERS"
        fi
    else
        echo "   Status: ❌ FAILED or INCOMPLETE"
    fi
    
    # Show last few lines of the log
    echo "   Last lines:"
    tail -3 "$LATEST_LOG" | sed 's/^/     /'
else
    echo "   No recent sync logs found."
fi

echo ""

# Check for errors
ERROR_LOG="$LOGS_DIR/sync-errors.log"
if [ -f "$ERROR_LOG" ] && [ -s "$ERROR_LOG" ]; then
    echo "⚠️  Recent Errors:"
    tail -5 "$ERROR_LOG" | sed 's/^/   /'
else
    echo "✅ No recent errors logged."
fi

echo ""
echo "💡 Commands:"
echo "   Run sync now: ./daily-sync.sh"
echo "   View latest log: tail -f $LATEST_LOG"
echo "   Setup daily schedule: ./setup-cron.sh" 