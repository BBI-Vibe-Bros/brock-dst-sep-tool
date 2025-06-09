#!/bin/bash

# Medicare SEP Finder - Frontend Launcher
# This script starts a local web server for the Medicare SEP finder application

echo "🚀 Starting Medicare SEP Finder Frontend..."
echo "============================================="

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    echo "✅ Using Python 3 web server"
    echo "📱 Opening: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    
    # Try to open in browser (macOS)
    if command -v open &> /dev/null; then
        sleep 2 && open http://localhost:8000 &
    fi
    
    python3 -m http.server 8000
    
# Check if Python 2 is available
elif command -v python &> /dev/null; then
    echo "✅ Using Python 2 web server"
    echo "📱 Opening: http://localhost:8000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    
    # Try to open in browser (macOS)
    if command -v open &> /dev/null; then
        sleep 2 && open http://localhost:8000 &
    fi
    
    python -m SimpleHTTPServer 8000
    
# Check if Node.js is available
elif command -v node &> /dev/null; then
    echo "✅ Using Node.js serve"
    echo "📱 Opening: http://localhost:3000"
    echo "🛑 Press Ctrl+C to stop the server"
    echo ""
    
    # Try to open in browser (macOS)
    if command -v open &> /dev/null; then
        sleep 2 && open http://localhost:3000 &
    fi
    
    npx serve . --listen 3000
    
else
    echo "❌ No web server available"
    echo ""
    echo "💡 Alternative options:"
    echo "1. Open index.html directly in your browser"
    echo "2. Install Python: https://python.org"
    echo "3. Install Node.js: https://nodejs.org"
    echo ""
    echo "📁 File location: $(pwd)/index.html"
    
    # Try to open the file directly (macOS)
    if command -v open &> /dev/null; then
        echo "🔄 Opening index.html directly..."
        open index.html
    fi
fi 