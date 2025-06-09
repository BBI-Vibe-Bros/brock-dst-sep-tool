import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Extend to 2 years to catch long-running disasters
const today = new Date();
const twoYearsAgo = new Date();
twoYearsAgo.setFullYear(today.getFullYear() - 2);
const twoYearsAgoStr = twoYearsAgo.toISOString().split('T')[0];

// Get all disasters from last 2 years, prioritizing active ones
const FEMA_URL = `https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries?$orderby=declarationDate desc&$filter=declarationDate ge ${twoYearsAgoStr}`;

const fetchFemaDisasters = async () => {
  console.log("�� Fetching FEMA data for Medicare SEP eligibility...");
  const res = await fetch(FEMA_URL);
  const json = await res.json();
  return json.DisasterDeclarationsSummaries || [];
};

const groupDisastersByNumber = (disasters) => {
  const grouped = {};
  
  for (const disaster of disasters) {
    const disasterNum = disaster.disasterNumber;
    
    if (!grouped[disasterNum]) {
      grouped[disasterNum] = {
        disasterNumber: disasterNum,
        state: disaster.state,
        incidentType: disaster.incidentType,
        declarationTitle: disaster.declarationTitle,
        incidentBeginDate: disaster.incidentBeginDate,
        incidentEndDate: disaster.incidentEndDate,
        disasterCloseoutDate: disaster.disasterCloseoutDate,
        lastIAFilingDate: disaster.lastIAFilingDate,
        declarationDate: disaster.declarationDate,
        region: disaster.region,
        counties: []
      };
    }
    
    // Add county to the list if it's not already there
    const countyName = disaster.designatedArea?.replace(' (County)', '').replace(' (Parish)', '');
    if (countyName && !grouped[disasterNum].counties.includes(countyName)) {
      grouped[disasterNum].counties.push(countyName);
    }
  }
  
  return Object.values(grouped);
};

const isActiveDisaster = (disaster) => {
  // Disaster is active if:
  // 1. No close date (still open), OR
  // 2. Close date is in the future, OR  
  // 3. Last filing date is in the future (assistance still available)
  
  const now = new Date();
  
  if (!disaster.disasterCloseoutDate) {
    return true; // Still open
  }
  
  const closeDate = new Date(disaster.disasterCloseoutDate);
  if (closeDate > now) {
    return true; // Future close date
  }
  
  if (disaster.lastIAFilingDate) {
    const filingDate = new Date(disaster.lastIAFilingDate);
    if (filingDate > now) {
      return true; // Assistance still available
    }
  }
  
  return false;
};

const syncToSupabase = async () => {
  const disasters = await fetchFemaDisasters();

  if (disasters.length === 0) {
    console.log("⚠️ No disasters found in FEMA response.");
    return;
  }

  console.log(`📊 Processing ${disasters.length} disaster records for Medicare SEP eligibility...`);
  
  // Group disasters by number to collect all counties
  const groupedDisasters = groupDisastersByNumber(disasters);
  console.log(`🗂️ Found ${groupedDisasters.length} unique disasters.`);
  
  // Filter for active disasters only
  const activeDisasters = groupedDisasters.filter(isActiveDisaster);
  console.log(`🔥 Found ${activeDisasters.length} active disasters with potential SEP eligibility.`);

  let count = 0;

  for (const d of activeDisasters) {
    // Medicare SEP end date: Use assistance end date
    let sepEndDate = null;
    if (d.lastIAFilingDate) {
      // Use last assistance filing date (when people can no longer apply for aid)
      sepEndDate = d.lastIAFilingDate.split('T')[0];
    } else if (d.disasterCloseoutDate) {
      // Use disaster closeout date if no filing date available
      sepEndDate = d.disasterCloseoutDate.split('T')[0];
    }

    // Calculate assistance days and SEP eligibility
    let assistanceDays = null;
    let daysRemaining = null;
    let sepEligible = true;

    if (sepEndDate && d.incidentBeginDate) {
      const start = new Date(d.incidentBeginDate);
      const end = new Date(sepEndDate);
      assistanceDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      // Calculate days remaining for SEP
      const today = new Date();
      const endDate = new Date(sepEndDate);
      daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      sepEligible = daysRemaining > 0;
    }

    const insertData = {
      state: d.state,
      disaster_type: d.incidentType,
      start_date: d.incidentBeginDate ? d.incidentBeginDate.split('T')[0] : null,
      end_date: sepEndDate,
      counties: d.counties.join(', '), // Join all counties for easy searching
      fema_link: `https://www.fema.gov/disaster/${d.disasterNumber}`,
      disaster_name: d.declarationTitle,
      fema_disaster_number: d.disasterNumber,
      status: true, // Mark as active
      region: d.region, // FEMA region
      county_count: d.counties.length,
      assistance_days: assistanceDays,
      // Medicare SEP specific fields
      declaration_date: d.declarationDate ? d.declarationDate.split('T')[0] : null,
      sep_eligible: sepEligible,
      sep_end_date: sepEndDate,
      days_remaining: daysRemaining > 0 ? daysRemaining : null,
    };

    const { error } = await supabase
      .from('seps')
      .upsert(insertData, { onConflict: 'fema_disaster_number' });

    if (error) {
      console.error(`❌ Error syncing disaster ${d.disasterNumber}:`, error.message);
    } else {
      const sepStatus = sepEligible 
        ? (daysRemaining ? `${daysRemaining} days remaining` : 'ongoing SEP') 
        : 'SEP expired';
      console.log(`✅ Synced ${d.disasterNumber} (${d.counties.length} counties, SEP: ${sepStatus})`);
      count++;
    }
  }

  console.log(`🎉 Medicare SEP sync complete: ${count} disasters with SEP eligibility updated.`);
};

syncToSupabase();
