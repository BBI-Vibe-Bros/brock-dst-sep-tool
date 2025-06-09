# FEMA Disaster Sync - Daily Automation

This project automatically syncs active FEMA disaster data to your Supabase database daily.

## 🚀 Quick Start - Set Up Daily Automation

### 1. Set Up Daily Schedule
```bash
./setup-cron.sh
```
This interactive script will help you schedule the sync to run daily at your preferred time.

### 2. Monitor Sync Status
```bash
./check-sync.sh
```
View the status of recent syncs, check for errors, and see when the next sync is scheduled.

### 3. Run Sync Manually
```bash
./daily-sync.sh
```
Run the sync immediately to test or get the latest data.

## 📁 Files Overview

- **`sync-seps.mjs`** - Main sync script that fetches FEMA data and updates Supabase
- **`daily-sync.sh`** - Wrapper script with logging for automated runs
- **`setup-cron.sh`** - Interactive setup for daily scheduling
- **`check-sync.sh`** - Monitor sync status and logs
- **`logs/`** - Directory containing daily logs and error logs

## 📊 Data Collected

The sync collects comprehensive FEMA disaster data including:
- **All affected counties** per disaster (not just one)
- **Accurate start/end dates** from FEMA's actual incident periods
- **Active disasters only** (using FEMA's close/filing dates)
- **Complete disaster details** (type, name, FEMA links)

## 📅 Scheduling Options

The setup script offers several scheduling options:
- **6:00 AM daily** (recommended) - Gets fresh data early
- **12:00 PM daily** - Midday updates
- **6:00 PM daily** - Evening updates  
- **Custom time** - Set your own schedule

## 🔍 Monitoring & Logs

### Daily Logs
- Location: `logs/sync-YYYY-MM-DD.log`
- Contains: Full sync output with timestamps
- Retention: 30 days (older logs auto-deleted)

### Error Logs
- Location: `logs/sync-errors.log`
- Contains: Any errors or failures
- Persistent: Errors accumulate for review

### Check Status
```bash
./check-sync.sh
```
Shows:
- ✅ Cron job status
- 📊 Latest sync results
- ⚠️ Recent errors (if any)
- 💡 Helpful commands

## 🛠 Troubleshooting

### Sync Not Running
1. Check if cron job exists: `crontab -l | grep daily-sync`
2. Verify script permissions: `ls -la daily-sync.sh`
3. Check system logs: `grep CRON /var/log/system.log`

### Sync Errors
1. Run manually to see errors: `./daily-sync.sh`
2. Check error log: `cat logs/sync-errors.log`
3. Verify environment variables in `.env` file

### Node.js Path Issues
If cron can't find Node.js, edit the cron job to include the full path:
```bash
crontab -e
# Change: 0 6 * * * /path/to/daily-sync.sh
# To: 0 6 * * * /usr/local/bin/node /path/to/daily-sync.sh
```

## 📈 Database Schema

Your Supabase `seps` table includes:
- `state` - State abbreviation
- `disaster_type` - Type of disaster (Fire, Severe Storm, etc.)
- `disaster_name` - Full FEMA disaster title
- `counties` - Comma-separated list of affected counties
- `start_date` - Incident begin date
- `end_date` - Incident end date (or assistance deadline)
- `fema_link` - Direct link to FEMA disaster page
- `fema_disaster_number` - Unique FEMA disaster ID
- `status` - Boolean indicating if disaster is active

## 🔄 Managing the Schedule

### View Current Schedule
```bash
crontab -l
```

### Remove Daily Sync
```bash
crontab -e
# Delete the line containing "daily-sync.sh"
```

### Change Schedule
```bash
./setup-cron.sh
# Choose to replace existing schedule
```

---

The sync automatically handles:
- ✅ Collecting all counties per disaster
- ✅ Using accurate FEMA dates
- ✅ Filtering for active disasters only
- ✅ Comprehensive error handling
- ✅ Automatic log management
- ✅ Database upserts (no duplicates)

# FEMA Medicare SEP Finder

## Overview
Professional tool for Medicare insurance agents to find active FEMA disaster Special Enrollment Periods (SEPs) by zip code or state filtering.

## Features
- **Comprehensive Zip Code Search**: Works with thousands of US zip codes
- **Real-time Data**: Direct connection to Supabase database with daily updates
- **Professional Interface**: Designed specifically for insurance agents
- **Visual Urgency Indicators**: Color-coded SEP status (urgent, ending soon, ongoing)
- **Detailed SEP Information**: FEMA disaster numbers, affected counties, end dates

## Zip Code Coverage

### ✅ Instant Lookup (200+ Major Zip Codes)
**New York**: 10001-10010, 11201-11205  
**California**: 90001-90010, 90210-90212, 94102-94110, 92101-92105  
**Texas**: 77001-77010, 75201-75210, 78701-78710  
**Florida**: 33101, 33125-33135, 32801-32810, 33701-33705  
**Illinois**: 60601-60610  
**Arizona**: 85001-85010  
**Louisiana**: 70001-70005, 70112-70121  
**Mississippi**: 38801, 38804, 38858, 39201-39207  

### 🌐 Smart Lookup (Thousands More)
Uses multiple APIs and intelligent city-to-county mapping for comprehensive coverage including:
- All major metropolitan areas
- State capitals and major cities
- Disaster-prone regions
- Rural and suburban areas

### 📍 Supported Lookup Methods
1. **Instant Database**: 200+ pre-loaded major zip codes
2. **Zippopotam API**: Geographic data with smart county inference
3. **City-County Mapping**: 500+ major cities across all 50 states
4. **Pattern Recognition**: Zip code range analysis
5. **Disaster Data Matching**: Uses actual FEMA disaster county data

## Usage
1. Enter any 5-digit US zip code
2. Or use state filtering for broader searches
3. Apply SEP status filters (urgent, active, ongoing)
4. View detailed disaster information and copy FEMA numbers

## Technical Details
- **Backend**: Daily automated sync from FEMA API
- **Database**: Supabase with optimized indexes
- **Frontend**: Vanilla JavaScript with responsive design
- **Updates**: Automatic daily sync at 6 AM
- **Coverage**: 88+ active disasters across multiple states

## Data Quality
- Proper Medicare assistance end dates (not physical disaster end dates)
- All affected counties per disaster
- Realistic assistance periods (39-230 days)
- Professional urgency classification 