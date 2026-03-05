// Medicare SEP Finder - JavaScript Application
// Insurance Agent Tool for FEMA Disaster SEP Eligibility

// ===== CONFIGURATION =====
// Values are injected from index.html so credentials are configured in one place.
const SUPABASE_CONFIG = window.SUPABASE_CONFIG || {};

if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    throw new Error('Missing SUPABASE_CONFIG. Update Supabase URL and anon key in index.html.');
}

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// State abbreviation to full name map
const STATE_NAMES = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    DC: 'District of Columbia', PR: 'Puerto Rico', VI: 'Virgin Islands', GU: 'Guam',
    AS: 'American Samoa', MP: 'Northern Mariana Islands'
};

// Global variables
let allSepData = [];
let filteredData = [];
let currentSort = 'state'; // Always group by state

// ===== APPLICATION INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading(true);
        await loadSepData();
        populateDropdowns();
        displayResults(allSepData);
        updateStatistics();
        setupEventListeners();
        setupStickySearch();
        updateLastUpdated();
        showLoading(false);
    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to load Medicare SEP data. Please check your connection and try again.');
        showLoading(false);
    }
}

// ===== DATA LOADING =====
async function loadSepData() {
    const { data, error } = await supabaseClient
        .from('seps')
        .select(`
            fema_disaster_number,
            state,
            disaster_type,
            disaster_name,
            counties,
            county_count,
            declaration_date,
            start_date,
            sep_end_date,
            days_remaining,
            sep_eligible,
            region,
            fema_link,
            last_updated
        `)
        .eq('sep_eligible', true)
        .order('days_remaining', { ascending: true, nullsFirst: false });
    
    if (error) {
        throw new Error('Failed to fetch SEP data: ' + error.message);
    }
    
    allSepData = data || [];
    filteredData = [...allSepData];
}

// ===== UI POPULATION =====
function populateDropdowns() {
    const states = [...new Set(allSepData.map(item => item.state))].sort();

    // Main state dropdown
    const stateSelect = document.getElementById('stateFilter');
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });

    // Sticky state dropdown
    const stickyStateSelect = document.getElementById('stickyState');
    if (stickyStateSelect) {
        states.forEach(state => {
            const option = document.createElement('option');
            option.value = state;
            option.textContent = state;
            stickyStateSelect.appendChild(option);
        });
    }
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('clearBtn').addEventListener('click', handleClear);
    
    // County input handling
    const countyInput = document.getElementById('countySearch');
    countyInput.addEventListener('input', debounce(handleSearch, 300));
    countyInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    // Filter change listeners  
    document.getElementById('stateFilter').addEventListener('change', handleSearch);
    document.getElementById('sepStatusFilter').addEventListener('change', handleSearch);

    // Sticky search listeners
    const stickySearchBtn = document.getElementById('stickySearchBtn');
    if (stickySearchBtn) {
        stickySearchBtn.addEventListener('click', handleStickySearch);
    }

    const stickyCounty = document.getElementById('stickyCounty');
    if (stickyCounty) {
        stickyCounty.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleStickySearch();
        });
    }

    const stickyState = document.getElementById('stickyState');
    if (stickyState) {
        stickyState.addEventListener('change', handleStickySearch);
    }

    const stickyStatus = document.getElementById('stickyStatus');
    if (stickyStatus) {
        stickyStatus.addEventListener('change', handleStickySearch);
    }
}

// ===== STICKY SEARCH =====
function setupStickySearch() {
    const heroSection = document.getElementById('heroSection');
    const stickySearch = document.getElementById('stickySearch');
    if (!heroSection || !stickySearch) return;

    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                stickySearch.classList.remove('visible');
            } else {
                stickySearch.classList.add('visible');
            }
        },
        {
            rootMargin: '-68px 0px 0px 0px', // offset for header height
            threshold: 0
        }
    );

    observer.observe(heroSection);
}

function handleStickySearch() {
    const stickyCounty = document.getElementById('stickyCounty');
    const stickyState = document.getElementById('stickyState');
    const stickyStatus = document.getElementById('stickyStatus');

    // Sync values to main controls
    document.getElementById('countySearch').value = stickyCounty.value;
    document.getElementById('stateFilter').value = stickyState.value;
    document.getElementById('sepStatusFilter').value = stickyStatus.value;

    handleSearch();
}

function syncStickyFromMain() {
    const stickyCounty = document.getElementById('stickyCounty');
    const stickyState = document.getElementById('stickyState');
    const stickyStatus = document.getElementById('stickyStatus');
    if (!stickyCounty) return;

    stickyCounty.value = document.getElementById('countySearch').value;
    stickyState.value = document.getElementById('stateFilter').value;
    stickyStatus.value = document.getElementById('sepStatusFilter').value;
}

// ===== SEARCH AND FILTERING =====
function handleSearch() {
    const countySearch = document.getElementById('countySearch').value.trim().toLowerCase();
    const stateFilter = document.getElementById('stateFilter').value;
    const sepStatusFilter = document.getElementById('sepStatusFilter').value;
    
    filteredData = allSepData.filter(item => {
        // County search
        if (countySearch) {
            const countiesLower = item.counties.toLowerCase();
            const cleanCountySearch = countySearch.replace(/\s+(county|parish|borough)$/i, '');
            if (!countiesLower.includes(cleanCountySearch)) {
                return false;
            }
        }
        
        // State filter
        if (stateFilter && item.state !== stateFilter) {
            return false;
        }
        
        // SEP status filter
        if (sepStatusFilter) {
            const daysRemaining = item.days_remaining;
            switch (sepStatusFilter) {
                case 'urgent':
                    if (!daysRemaining || daysRemaining > 30) return false;
                    break;
                case 'active':
                    if (!daysRemaining || daysRemaining <= 30) return false;
                    break;
                case 'ongoing':
                    if (daysRemaining !== null) return false;
                    break;
            }
        }
        
        return true;
    });
    
    syncStickyFromMain();
    displayResults(filteredData);
    updateStatistics();
}

function handleClear() {
    document.getElementById('countySearch').value = '';
    document.getElementById('stateFilter').value = '';
    document.getElementById('sepStatusFilter').value = '';
    
    filteredData = [...allSepData];
    syncStickyFromMain();
    displayResults(filteredData);
    updateStatistics();
}

// ===== SORTING =====
function sortData(data) {
    const sorted = [...data];
    switch (currentSort) {
        case 'state':
            sorted.sort((a, b) => a.state.localeCompare(b.state));
            break;
        case 'urgency':
            sorted.sort((a, b) => {
                const aVal = a.days_remaining === null ? 9999 : a.days_remaining;
                const bVal = b.days_remaining === null ? 9999 : b.days_remaining;
                return aVal - bVal;
            });
            break;
        case 'counties':
            sorted.sort((a, b) => (b.county_count || 0) - (a.county_count || 0));
            break;
        case 'recent':
            sorted.sort((a, b) => new Date(b.declaration_date) - new Date(a.declaration_date));
            break;
    }
    return sorted;
}

// ===== DISPLAY FUNCTIONS =====
function displayResults(data) {
    const container = document.getElementById('resultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    
    if (data.length === 0) {
        const countySearch = document.getElementById('countySearch').value.trim();
        let message = 'No Medicare SEPs found';
        let suggestion = 'Try adjusting your search criteria or check back later for new disaster declarations.';
        
        if (countySearch) {
            message = `No active SEPs found for "${countySearch}"`;
            suggestion = `No current FEMA disasters affect "${countySearch}". Try searching for a different county or use the state filter.`;
        }
        
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>${message}</h3>
                <p>${suggestion}</p>
            </div>
        `;
        resultsCount.textContent = 'No results found';
        return;
    }
    
    resultsCount.textContent = `${data.length} SEP${data.length === 1 ? '' : 's'} found`;
    
    const sortedData = sortData(data);
    container.innerHTML = sortedData.map(sep => createSepCard(sep)).join('');

    // Bind show more/less for county lists
    container.querySelectorAll('.counties-show-more').forEach(btn => {
        const originalLabel = btn.textContent.trim();
        btn.addEventListener('click', function() {
            const overflow = this.previousElementSibling;
            overflow.classList.toggle('expanded');
            if (overflow.classList.contains('expanded')) {
                this.innerHTML = '<i class="fas fa-chevron-up"></i> Show Less';
            } else {
                this.innerHTML = `<i class="fas fa-chevron-down"></i> ${originalLabel}`;
            }
        });
    });
}

function createSepCard(sep) {
    const urgencyClass = getSepUrgencyClass(sep.days_remaining);
    const statusBadge = getSepStatusBadge(sep.days_remaining);
    const formattedDate = formatDate(sep.declaration_date);
    const formattedEndDate = sep.sep_end_date ? formatDate(sep.sep_end_date) : 'Ongoing';
    
    // Get state full name
    const stateName = STATE_NAMES[sep.state] || sep.state;

    // Parse counties into chips
    const countySearch = document.getElementById('countySearch').value.trim();
    const cleanCountySearch = countySearch ? countySearch.replace(/\s+(county|parish|borough)$/i, '') : '';
    
    const countyArray = sep.counties
        ? sep.counties.split(',').map(c => c.trim()).filter(Boolean)
        : [];

    // When a county search is active, split into matched vs other
    const hasCountySearch = !!cleanCountySearch;
    let matchedCounties = [];
    let otherCounties = [];

    if (hasCountySearch) {
        countyArray.forEach(county => {
            if (county.toLowerCase().includes(cleanCountySearch.toLowerCase())) {
                matchedCounties.push(county);
            } else {
                otherCounties.push(county);
            }
        });
    } else {
        otherCounties = countyArray;
    }

    // Build chips
    const matchedChips = matchedCounties.map(county =>
        `<span class="county-chip highlighted"><i class="fas fa-search"></i> ${county}</span>`
    ).join('');
    
    const otherChips = otherCounties.map(county =>
        `<span class="county-chip${hasCountySearch ? ' dimmed' : ''}">${county}</span>`
    ).join('');

    // Build counties HTML
    let countiesHtml;
    if (hasCountySearch && matchedCounties.length > 0) {
        // Show matched first, then collapsible "other" counties
        const othersNeedOverflow = otherCounties.length > 6;
        const othersGrid = othersNeedOverflow
            ? `<div class="counties-others-overflow"><div class="counties-grid">${otherChips}</div></div>
               <button class="counties-show-more"><i class="fas fa-chevron-down"></i> Show ${otherCounties.length} Other Counties</button>`
            : `<div class="counties-grid">${otherChips}</div>`;
        
        countiesHtml = `
            <div class="counties-grid counties-matched">${matchedChips}</div>
            ${otherCounties.length > 0 ? `<div class="counties-others">${othersGrid}</div>` : ''}
        `;
    } else {
        // No search active — show all normally
        const needsOverflow = countyArray.length > 12;
        const allChips = otherChips;
        countiesHtml = needsOverflow
            ? `<div class="counties-overflow"><div class="counties-grid">${allChips}</div></div>
               <button class="counties-show-more"><i class="fas fa-chevron-down"></i> Show All ${countyArray.length} Counties</button>`
            : `<div class="counties-grid">${allChips}</div>`;
    }
    
    return `
        <div class="sep-card ${urgencyClass}">
            <div class="sep-header">
                <div class="sep-title">
                    <h3>
                        <span class="title-state">${stateName}</span>
                        <span class="title-divider">|</span>
                        <span class="title-sep">${sep.disaster_name}</span>
                    </h3>
                    <div class="sep-subtitle">
                        ${sep.disaster_type} • FEMA ${sep.fema_disaster_number}
                    </div>
                </div>
                <div class="sep-status ${urgencyClass}">
                    ${statusBadge}
                </div>
            </div>
            
            <div class="sep-details">
                <div class="detail-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span class="detail-label">Declared:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar-times"></i>
                    <span class="detail-label">SEP Ends:</span>
                    <span class="detail-value">${formattedEndDate}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marked-alt"></i>
                    <span class="detail-label">Counties:</span>
                    <span class="detail-value">${sep.county_count}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-globe-americas"></i>
                    <span class="detail-label">Region:</span>
                    <span class="detail-value">${sep.region}</span>
                </div>
            </div>
            
            <div class="sep-counties">
                <div class="counties-header">
                    <i class="fas fa-map"></i> Affected Counties (${sep.county_count})
                </div>
                ${countiesHtml}
            </div>
            
            <div class="sep-actions">
                <a href="${sep.fema_link}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> View FEMA Details
                </a>
                <button class="btn btn-secondary" onclick="copyToClipboard(event, '${sep.fema_disaster_number}')">
                    <i class="fas fa-copy"></i> Copy FEMA #
                </button>
            </div>
        </div>
    `;
}

function getSepUrgencyClass(daysRemaining) {
    if (daysRemaining === null) return 'ongoing';
    if (daysRemaining <= 7) return 'urgent';
    if (daysRemaining <= 30) return 'ending-soon';
    return 'active';
}

function getSepStatusBadge(daysRemaining) {
    if (daysRemaining === null) return '⚠️ Ongoing SEP';
    if (daysRemaining <= 7) return `🚨 ${daysRemaining} days left`;
    if (daysRemaining <= 30) return `⚡ ${daysRemaining} days left`;
    return `✅ ${daysRemaining} days left`;
}

// ===== STATISTICS =====
function updateStatistics() {
    const stats = calculateStatistics(filteredData);
    
    document.getElementById('urgentCount').textContent = stats.urgent;
    document.getElementById('activeCount').textContent = stats.active;
    document.getElementById('ongoingCount').textContent = stats.ongoing;
    document.getElementById('totalCounties').textContent = stats.totalCounties;

    // Update sticky total
    const stickyTotal = document.getElementById('stickyTotal');
    if (stickyTotal) {
        stickyTotal.textContent = filteredData.length;
    }
}

function calculateStatistics(data) {
    let urgent = 0;
    let active = 0;
    let ongoing = 0;
    let totalCounties = 0;
    
    data.forEach(sep => {
        totalCounties += sep.county_count || 0;
        
        if (sep.days_remaining === null) {
            ongoing++;
        } else if (sep.days_remaining <= 30) {
            urgent++;
        } else {
            active++;
        }
    });
    
    return { urgent, active, ongoing, totalCounties };
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    const container = document.getElementById('resultsContainer');
    
    if (show) {
        spinner.style.display = 'block';
        container.style.display = 'none';
    } else {
        spinner.style.display = 'none';
        container.style.display = 'flex';
    }
}

function showError(message) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error Loading Data</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <i class="fas fa-refresh"></i> Try Again
            </button>
        </div>
    `;
}

function updateLastUpdated() {
    if (allSepData.length > 0) {
        const lastUpdate = new Date(allSepData[0].last_updated);
        const formatted = lastUpdate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastUpdated').innerHTML = 
            `<i class="fas fa-clock"></i> Last updated: ${formatted}`;
    }
}

function copyToClipboard(e, femaNumber) {
    e.preventDefault();
    const btn = e.currentTarget;
    const originalText = btn.innerHTML;
    
    navigator.clipboard.writeText(femaNumber).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Copied FEMA # ✓';
        btn.style.background = 'rgba(16, 185, 129, 0.15)';
        btn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        btn.style.color = '#10b981';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}
