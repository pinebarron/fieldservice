#!/bin/bash
# Build script for Capacitor mobile app
# Prepares the native projects for development or production

set -e

echo "Building Field Capture for mobile..."

# Create minimal out directory for Capacitor
rm -rf out
mkdir -p out

# Create a loading page (displayed briefly while connecting to server)
cat > out/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>Field Capture</title>
  <style>
    body {
      font-family: -apple-system, system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #2d5a3d;
      color: white;
    }
    .loading { text-align: center; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Loading Field Capture...</p>
  </div>
</body>
</html>
EOF

# Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

echo ""
echo "Mobile build complete!"
echo ""
echo "For Development:"
echo "  1. Start the dev server: npm run dev"
echo "  2. Open in Xcode: npm run ios"
echo "     or Android Studio: npm run android"
echo "  3. The app will connect to http://localhost:3000"
echo ""
echo "For Production:"
echo "  1. Deploy your Next.js app to a server"
echo "  2. Update capacitor.config.ts with your production URL"
echo "  3. Run: npm run build:mobile"
echo "  4. Build the native app in Xcode/Android Studio"
