#!/bin/bash

# Setup script for daily FEMA disaster sync

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DAILY_SYNC_PATH="$SCRIPT_DIR/daily-sync.sh"

echo "🔧 Setting up daily FEMA disaster sync automation..."
echo "Script location: $DAILY_SYNC_PATH"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "daily-sync.sh"; then
    echo "⚠️  Cron job already exists. Current crontab:"
    crontab -l | grep "daily-sync.sh"
    echo ""
    read -p "Do you want to replace it? (y/N): " replace
    if [[ $replace != "y" && $replace != "Y" ]]; then
        echo "❌ Setup cancelled."
        exit 0
    fi
    # Remove existing cron job
    crontab -l | grep -v "daily-sync.sh" | crontab -
fi

echo ""
echo "⏰ Choose when to run the daily sync:"
echo "1) 6:00 AM daily (recommended)"
echo "2) 12:00 PM daily" 
echo "3) 6:00 PM daily"
echo "4) Custom time"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        CRON_TIME="0 6 * * *"
        TIME_DESC="6:00 AM daily"
        ;;
    2)
        CRON_TIME="0 12 * * *"
        TIME_DESC="12:00 PM daily"
        ;;
    3)
        CRON_TIME="0 18 * * *"
        TIME_DESC="6:00 PM daily"
        ;;
    4)
        echo "Enter cron time format (minute hour * * *):"
        echo "Examples: '0 9 * * *' for 9:00 AM, '30 14 * * *' for 2:30 PM"
        read -p "Cron time: " CRON_TIME
        TIME_DESC="$CRON_TIME"
        ;;
    *)
        echo "❌ Invalid selection. Using default 6:00 AM."
        CRON_TIME="0 6 * * *"
        TIME_DESC="6:00 AM daily"
        ;;
esac

# Add the cron job
(crontab -l 2>/dev/null; echo "$CRON_TIME $DAILY_SYNC_PATH") | crontab -

echo ""
echo "✅ Cron job added successfully!"
echo "📅 Schedule: $TIME_DESC"
echo "📁 Logs will be saved to: $SCRIPT_DIR/logs/"
echo ""
echo "To view your current crontab: crontab -l"
echo "To remove the cron job later: crontab -e (then delete the line)"
echo ""
echo "🔍 You can monitor the sync by checking:"
echo "   - Daily logs: $SCRIPT_DIR/logs/sync-YYYY-MM-DD.log"
echo "   - Error log: $SCRIPT_DIR/logs/sync-errors.log" 