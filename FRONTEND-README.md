# Medicare Disaster SEP Finder - Frontend Application

A professional web interface for Medicare insurance agents to find FEMA disaster Special Enrollment Periods (SEPs) for their clients using **zip code search**.

## 🚀 Quick Start

Your frontend is **ready to use** - just open `index.html` in a web browser!

### Files Included:
- `index.html` - Main application interface
- `style.css` - Professional styling for insurance agents
- `app.js` - Application logic (already configured with your Supabase credentials)

## 💻 How to Use

### **Method 1: Local File (Immediate)**
1. Open `index.html` directly in your web browser
2. The app will automatically load your Medicare SEP data
3. Start searching for client eligibility immediately

### **Method 2: Web Server (Recommended for Production)**
```bash
# Using Python (if installed)
python3 -m http.server 8000

# Using Node.js (if installed)
npx serve .

# Then visit: http://localhost:8000
```

## 🔍 Features for Insurance Agents

### **🎯 Agent-Focused Search**
- **Zip Code Search**: Enter your client's 5-digit zip code for instant county lookup
- **State Filtering**: Focus on your territory/market area
- **SEP Status**: Find urgent (ending soon) vs. ongoing opportunities
- **Real-time Validation**: Automatic zip code verification and county identification

### **📊 Real-Time Dashboard**
- **Ending Soon** 🚨 - SEPs requiring immediate action (≤30 days)
- **Active SEPs** ✅ - Standard active enrollment periods
- **Ongoing SEPs** ⚠️ - Open-ended enrollment (no end date)
- **Total Counties** 🗺️ - Geographic coverage across all disasters

### **💼 Professional Agent Tools**
- **FEMA Links** - Direct links to official disaster pages
- **Copy FEMA Numbers** - Quick copy for client applications
- **County Highlighting** - Visual emphasis on client's county when found
- **Urgency Indicators** - Visual alerts for time-sensitive SEPs

## 🔍 How to Help Your Clients

### **Step 1: Client Zip Code Search**
```
Client says: "I live in zip code 77001"
You enter: "77001" in the zip search box
System shows: "✓ Harris County, TX"
Result: All active SEPs affecting Harris County automatically displayed
```

### **Step 2: Check SEP Status**
- **🚨 Urgent**: Client needs to enroll within days/weeks
- **⚡ Ending Soon**: Client has limited time (≤30 days)
- **✅ Active**: Standard enrollment window
- **⚠️ Ongoing**: Open enrollment period

### **Step 3: Verify Eligibility**
- Click "View FEMA Details" for official verification
- Use FEMA disaster number for applications
- Share end dates with clients for urgency

## 📋 Common Agent Scenarios

### **Scenario 1: New Client Call**
> *"I heard there might be a Medicare enrollment period because of the recent storm. My zip code is 33101."*

**Your Action:**
1. Enter "33101" in zip search
2. System shows "✓ Miami-Dade County, FL"
3. View all active SEPs for that area
4. Explain available options and end dates

### **Scenario 2: Territory Planning**
> *"What Medicare opportunities are available in my Florida territory?"*

**Your Action:**
1. Filter by "FL" state
2. Review all active disasters
3. Note affected counties in your market area
4. Plan outreach based on end dates

### **Scenario 3: Urgent Follow-up**
> *"Which of my clients need immediate attention?"*

**Your Action:**
1. Filter by "Ending Soon (≤30 days)"
2. Review affected counties
3. Cross-reference with your client database
4. Prioritize by days remaining

## 🎨 Visual Indicators

### **Zip Code Status:**
- **✓ County Name, ST**: Valid zip code found
- **❌ Error message**: Invalid or not found zip code
- **Looking up location...**: Processing zip code

### **SEP Color Coding:**
- **🔴 Red Border**: Urgent action needed (≤7 days)
- **🟡 Orange Border**: Ending soon (≤30 days)  
- **🟢 Green Border**: Ongoing SEPs (no end date)
- **🔵 Blue Border**: Active standard periods

### **Status Badges:**
- **🚨 X days left**: Critical urgency
- **⚡ X days left**: Time-sensitive
- **✅ X days left**: Standard active
- **⚠️ Ongoing SEP**: Open enrollment

## 📊 Data Understanding

### **What You See:**
- **Declaration Date**: When FEMA declared the disaster
- **SEP End Date**: When Medicare enrollment closes
- **Counties**: All affected areas (client's county highlighted)
- **FEMA Region**: Geographic organization (1-10)
- **Disaster Type**: Fire, Storm, Hurricane, Flood, etc.

### **Data Freshness:**
- Updates daily at 6:00 AM
- "Last updated" timestamp shown at top
- Automatically syncs from FEMA API

## 🔧 Troubleshooting

### **Zip Code Issues?**
- Ensure you enter exactly 5 digits
- Try a nearby zip code if client's doesn't work
- Some rural areas may not be in the database

### **No Data Loading?**
- Check your internet connection
- Try refreshing the page
- Ensure your daily sync is running

### **County Not Found in Results?**
- The zip code lookup was successful but no active SEPs
- Area may not be affected by current disasters
- Try searching nearby zip codes

## 📱 Mobile Friendly

The interface is fully responsive and works on:
- **Desktop**: Full functionality for office use
- **Tablet**: Perfect for client meetings
- **Mobile**: Quick lookups while in the field

## 🔒 Data Security

- **Read-Only Access**: Interface only displays data
- **No Client Data**: No personal information stored
- **Secure Connection**: Uses HTTPS Supabase connection
- **Public Data**: All FEMA disaster information is public

## 📈 Business Benefits

### **For Agents:**
- ✅ **Faster Client Service**: Instant zip-to-SEP eligibility checks
- ✅ **No County Guessing**: Automatic county identification
- ✅ **Territory Planning**: State-by-state opportunity identification  
- ✅ **Urgency Management**: Never miss time-sensitive enrollments
- ✅ **Professional Tool**: Impress clients with immediate answers

### **For Agencies:**
- ✅ **Competitive Advantage**: Real-time disaster SEP tracking
- ✅ **Revenue Opportunities**: Identify new enrollment periods
- ✅ **Agent Efficiency**: Streamlined eligibility verification
- ✅ **Client Satisfaction**: Quick, accurate zip code lookups

## 🎯 Pro Tips for Agents

1. **Use Zip Codes**: Much faster than trying to remember county names
2. **Watch Auto-Search**: Results update automatically after zip lookup
3. **Check Daily**: New disasters = new opportunities
4. **Focus on Urgent**: Prioritize ending-soon SEPs
5. **Copy FEMA Numbers**: Speeds up applications
6. **Monitor Your Territory**: Set up state filters for your area
7. **Verify Zip Codes**: Double-check client's zip before relying on results

## 🚀 Example Workflow

```
1. Client calls: "My zip is 90210, do I qualify for disaster Medicare SEP?"

2. You enter: "90210" 
   → System shows: "✓ Beverly Hills, CA"

3. If SEPs found: Show client the options and end dates
   If no SEPs: "No active disaster SEPs for your area currently"

4. Follow up: Use FEMA links to verify and help with enrollment
```

---

**Your Medicare disaster SEP finder is now optimized for the real world of insurance agents - zip codes, not county names!** 🌟 