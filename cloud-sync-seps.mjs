#!/usr/bin/env node

// FEMA Medicare SEP Sync - Cloud Version
// Bobby Brock Insurance - Professional Tool
// Runs daily in GitHub Actions cloud environment

import { createClient } from '@supabase/supabase-js';

// ===== CONFIGURATION (Environment Variables) =====
const SUPABASE_CONFIG = {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Validate environment variables
if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);

// FEMA API Configuration
const FEMA_API_BASE = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';

// ===== MAIN SYNC FUNCTION =====
async function syncFemaSeps() {
    console.log('📥 Fetching FEMA data for Medicare SEP eligibility...');
    
    try {
        // Fetch FEMA disaster data
        const response = await fetch(`${FEMA_API_BASE}?$top=1000`);
        if (!response.ok) {
            throw new Error(`FEMA API error: ${response.status}`);
        }
        
        const femaData = await response.json();
        const disasters = femaData.DisasterDeclarationsSummaries || [];
        
        console.log(`📊 Processing ${disasters.length} disaster records for Medicare SEP eligibility...`);
        
        // Group by disaster number and process
        const groupedDisasters = groupDisastersByNumber(disasters);
        console.log(`🗂️ Found ${Object.keys(groupedDisasters).length} unique disasters.`);
        
        // Filter active disasters (within 2 years)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
        
        const activeDisasters = Object.values(groupedDisasters).filter(disaster => {
            const declarationDate = new Date(disaster.declarationDate);
            return declarationDate >= twoYearsAgo;
        });
        
        console.log(`🔥 Found ${activeDisasters.length} active disasters with potential SEP eligibility.`);
        
        // Process each disaster for Medicare SEP eligibility
        let syncedCount = 0;
        for (const disaster of activeDisasters) {
            const sepData = calculateMedicareSep(disaster);
            await upsertDisaster(sepData);
            
            const status = sepData.sep_eligible ? 
                (sepData.days_remaining ? `${sepData.days_remaining} days remaining` : 'ongoing SEP') :
                'SEP expired';
            
            console.log(`✅ Synced ${disaster.femaDisasterNumber} (${disaster.counties.length} counties, SEP: ${status})`);
            syncedCount++;
        }
        
        console.log(`🎉 Medicare SEP sync complete: ${syncedCount} disasters with SEP eligibility updated.`);
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

// ===== HELPER FUNCTIONS =====
function groupDisastersByNumber(disasters) {
    const grouped = {};
    
    disasters.forEach(disaster => {
        const disasterNumber = disaster.femaDisasterNumber;
        
        if (!grouped[disasterNumber]) {
            grouped[disasterNumber] = {
                femaDisasterNumber: disasterNumber,
                state: disaster.state,
                disasterType: disaster.incidentType,
                disasterName: disaster.title,
                declarationDate: disaster.declarationDate,
                incidentBeginDate: disaster.incidentBeginDate,
                incidentEndDate: disaster.incidentEndDate,
                lastIAFilingDate: disaster.lastIAFilingDate,
                counties: [],
                region: disaster.femaRegion
            };
        }
        
        // Add county if not already included
        if (disaster.designatedArea && !grouped[disasterNumber].counties.includes(disaster.designatedArea)) {
            grouped[disasterNumber].counties.push(disaster.designatedArea);
        }
    });
    
    return grouped;
}

function calculateMedicareSep(disaster) {
    const now = new Date();
    const declarationDate = new Date(disaster.declarationDate);
    
    // Medicare SEP calculation based on Individual Assistance filing deadline
    let sepEndDate = null;
    let daysRemaining = null;
    let sepEligible = false;
    
    if (disaster.lastIAFilingDate) {
        sepEndDate = new Date(disaster.lastIAFilingDate);
        const timeDiff = sepEndDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        sepEligible = daysRemaining > 0;
    } else {
        // No end date means ongoing disaster - Medicare SEP likely active
        sepEligible = true;
        daysRemaining = null;
    }
    
    // Calculate assistance period
    const assistanceDays = disaster.lastIAFilingDate ? 
        Math.ceil((sepEndDate.getTime() - declarationDate.getTime()) / (1000 * 60 * 60 * 24)) : 
        null;
    
    return {
        fema_disaster_number: disaster.femaDisasterNumber,
        state: disaster.state,
        disaster_type: disaster.disasterType,
        disaster_name: disaster.disasterName,
        counties: disaster.counties.join(', '),
        county_count: disaster.counties.length,
        declaration_date: disaster.declarationDate,
        start_date: disaster.incidentBeginDate,
        end_date: disaster.incidentEndDate,
        sep_end_date: disaster.lastIAFilingDate,
        days_remaining: daysRemaining,
        sep_eligible: sepEligible,
        region: disaster.region,
        assistance_days: assistanceDays,
        fema_link: `https://www.fema.gov/disaster/declarations/${disaster.femaDisasterNumber}`,
        last_updated: now.toISOString()
    };
}

async function upsertDisaster(sepData) {
    const { error } = await supabase
        .from('seps')
        .upsert(sepData, { 
            onConflict: 'fema_disaster_number',
            ignoreDuplicates: false 
        });
    
    if (error) {
        throw new Error(`Database error: ${error.message}`);
    }
}

// ===== RUN SYNC =====
await syncFemaSeps(); 