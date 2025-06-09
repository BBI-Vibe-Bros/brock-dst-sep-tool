// Medicare SEP Finder - JavaScript Application
// Insurance Agent Tool for FEMA Disaster SEP Eligibility

// ===== CONFIGURATION =====
// Your Supabase credentials
const SUPABASE_CONFIG = {
    url: 'https://jdwidpewtalkgdmgptxi.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impkd2lkcGV3dGFsa2dkbWdwdHhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMzI0OTIsImV4cCI6MjA2NDcwODQ5Mn0.Gb0hEaj3WIJsbG0gzyBoGalxUw9VAeMkhl98USK9KaY'
};

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Global variables
let allSepData = [];
let filteredData = [];

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
    const { data, error } = await supabase
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
    // Populate state dropdown
    const states = [...new Set(allSepData.map(item => item.state))].sort();
    const stateSelect = document.getElementById('stateFilter');
    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
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
}

// ===== SEARCH AND FILTERING =====
function handleSearch() {
    const countySearch = document.getElementById('countySearch').value.trim().toLowerCase();
    const stateFilter = document.getElementById('stateFilter').value;
    const sepStatusFilter = document.getElementById('sepStatusFilter').value;
    
    filteredData = allSepData.filter(item => {
        // County search - simple string matching
        if (countySearch) {
            const countiesLower = item.counties.toLowerCase();
            // Remove common suffixes for better matching
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
    
    displayResults(filteredData);
    updateStatistics();
}

function handleClear() {
    document.getElementById('countySearch').value = '';
    document.getElementById('stateFilter').value = '';
    document.getElementById('sepStatusFilter').value = '';
    
    filteredData = [...allSepData];
    displayResults(filteredData);
    updateStatistics();
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
            suggestion = `No current FEMA disasters affect "${countySearch}". Try searching for a different county or use the state filter to see all SEPs in a state.`;
        }
        
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>${message}</h3>
                <p>${suggestion}</p>
                ${countySearch ? `<p><small>Searched: ${countySearch}</small></p>` : ''}
            </div>
        `;
        resultsCount.textContent = 'No results found';
        return;
    }
    
    resultsCount.textContent = `${data.length} SEP${data.length === 1 ? '' : 's'} found`;
    
    // Sort results alphabetically by state
    const sortedData = [...data].sort((a, b) => a.state.localeCompare(b.state));
    
    container.innerHTML = sortedData.map(sep => createSepCard(sep)).join('');
}

function createSepCard(sep) {
    const urgencyClass = getSepUrgencyClass(sep.days_remaining);
    const statusBadge = getSepStatusBadge(sep.days_remaining);
    const formattedDate = formatDate(sep.declaration_date);
    const formattedEndDate = sep.sep_end_date ? formatDate(sep.sep_end_date) : 'Ongoing';
    
    // Highlight matching county if county search was used
    let countiesDisplay = sep.counties;
    const countySearch = document.getElementById('countySearch').value.trim();
    if (countySearch) {
        const cleanCountySearch = countySearch.replace(/\s+(county|parish|borough)$/i, '');
        const regex = new RegExp(`(${escapeRegex(cleanCountySearch)})`, 'gi');
        countiesDisplay = sep.counties.replace(regex, '<strong>$1</strong>');
    }
    
    return `
        <div class="sep-card ${urgencyClass}">
            <div class="sep-header">
                <div class="sep-title">
                    <h3>${sep.disaster_name}</h3>
                    <div class="sep-subtitle">
                        <span class="state">${sep.state}</span> • ${sep.disaster_type} • FEMA ${sep.fema_disaster_number}
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
                    <span class="detail-label">FEMA Region:</span>
                    <span class="detail-value">${sep.region}</span>
                </div>
            </div>
            
            <div class="sep-counties">
                <h4><i class="fas fa-map"></i> Affected Counties (${sep.county_count})</h4>
                <div class="counties-list">${countiesDisplay}</div>
            </div>
            
            <div class="sep-actions">
                <a href="${sep.fema_link}" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i> View FEMA Details
                </a>
                <button class="btn btn-secondary" onclick="copyToClipboard('${sep.fema_disaster_number}')">
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
        container.style.display = 'block';
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

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Simple feedback - you could enhance this with a toast notification
        const btn = event.target.closest('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        btn.style.background = '#27ae60';
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}