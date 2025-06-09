-- Medicare SEP Queries for Insurance Agents
-- Use these queries to help clients determine disaster SEP eligibility

-- 1. CHECK IF A SPECIFIC COUNTY HAS ACTIVE SEP
-- Replace 'YourState' and 'YourCounty' with actual values
SELECT 
  state,
  disaster_type,
  disaster_name,
  declaration_date,
  sep_end_date,
  days_remaining,
  fema_disaster_number,
  fema_link
FROM seps 
WHERE sep_eligible = true 
  AND state = 'FL'  -- Change this
  AND counties ILIKE '%Miami-Dade%'  -- Change this to your county
ORDER BY declaration_date DESC;

-- 2. ALL ACTIVE SEPs BY STATE (for agents working specific territories)
SELECT 
  state,
  COUNT(*) as active_disasters,
  SUM(county_count) as total_counties_affected,
  MIN(days_remaining) as shortest_sep_remaining,
  string_agg(DISTINCT disaster_type, ', ') as disaster_types
FROM seps 
WHERE sep_eligible = true 
  AND state = 'TX'  -- Change this to your state
GROUP BY state;

-- 3. SEPs ENDING SOON (urgent action needed)
SELECT 
  state,
  disaster_type,
  disaster_name,
  days_remaining,
  sep_end_date,
  county_count,
  LEFT(counties, 100) as sample_counties,
  fema_disaster_number
FROM seps 
WHERE sep_eligible = true 
  AND days_remaining IS NOT NULL 
  AND days_remaining <= 30  -- SEPs ending in 30 days or less
ORDER BY days_remaining ASC;

-- 4. SEARCH BY COUNTY NAME (for when client gives you their location)
SELECT 
  state,
  disaster_type,
  disaster_name,
  declaration_date,
  sep_end_date,
  CASE 
    WHEN days_remaining IS NULL THEN 'Ongoing'
    ELSE days_remaining || ' days remaining'
  END as sep_status,
  fema_link
FROM seps 
WHERE sep_eligible = true 
  AND counties ILIKE '%Harris%'  -- Change 'Harris' to search county
ORDER BY declaration_date DESC;

-- 5. COMPREHENSIVE AGENT DASHBOARD VIEW
-- Shows all active SEPs organized by urgency
SELECT 
  ROW_NUMBER() OVER (ORDER BY 
    CASE WHEN days_remaining IS NULL THEN 999999 ELSE days_remaining END
  ) as priority,
  state,
  disaster_type,
  county_count,
  CASE 
    WHEN days_remaining IS NULL THEN '⚠️ Ongoing SEP'
    WHEN days_remaining <= 7 THEN '🚨 ' || days_remaining || ' days left'
    WHEN days_remaining <= 30 THEN '⚡ ' || days_remaining || ' days left'
    ELSE '✅ ' || days_remaining || ' days left'
  END as urgency,
  declaration_date,
  LEFT(disaster_name, 50) as disaster_summary,
  LEFT(counties, 80) as affected_areas,
  fema_disaster_number
FROM seps 
WHERE sep_eligible = true
ORDER BY 
  CASE WHEN days_remaining IS NULL THEN 999999 ELSE days_remaining END;

-- 6. MULTI-STATE DISASTERS (for agents with regional coverage)
SELECT 
  disaster_type,
  disaster_name,
  string_agg(DISTINCT state, ', ') as affected_states,
  SUM(county_count) as total_counties,
  MIN(days_remaining) as shortest_sep_remaining,
  declaration_date,
  fema_disaster_number
FROM seps 
WHERE sep_eligible = true
GROUP BY disaster_type, disaster_name, declaration_date, fema_disaster_number
HAVING COUNT(DISTINCT state) > 1  -- Only multi-state disasters
ORDER BY total_counties DESC;

-- 7. RECENT DISASTERS (new SEP opportunities)
SELECT 
  state,
  disaster_type,
  disaster_name,
  declaration_date,
  county_count,
  counties,
  CASE 
    WHEN days_remaining IS NULL THEN 'Open enrollment period'
    ELSE days_remaining || ' days remaining'
  END as sep_window,
  fema_link
FROM seps 
WHERE sep_eligible = true 
  AND declaration_date >= CURRENT_DATE - INTERVAL '30 days'  -- Last 30 days
ORDER BY declaration_date DESC;

-- 8. COUNTY LOOKUP (exact match for client verification)
-- Use this when you need to verify specific client eligibility
SELECT 
  s.state,
  s.disaster_type,
  s.disaster_name,
  s.declaration_date,
  s.sep_end_date,
  s.days_remaining,
  s.fema_disaster_number,
  s.fema_link,
  'Client is eligible for Medicare disaster SEP' as eligibility_status
FROM seps s
WHERE s.sep_eligible = true 
  AND (
    s.counties ILIKE '%Orange%'  -- Change to client's county
    OR s.counties ILIKE '%Los Angeles%'  -- Add multiple counties if needed
  )
ORDER BY s.declaration_date DESC; 