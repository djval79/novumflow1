#!/bin/bash
# Temporary deployment monitoring script

SITE_URL="https://novumflow.netlify.app"
echo "🔍 Monitoring Netlify deployment for NOVUMFLOW..."
echo "Site URL: $SITE_URL"
echo "Timestamp: $(date)"
echo ""

# Check if site is responding
echo "📡 Testing site accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_URL")
echo "HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Site is live and responding!"
    echo "🌐 Visit: $SITE_URL"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "⏳ Site not found (404) - deployment may be in progress"
    echo "💡 This usually means the build is still running or failed"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Cannot reach site - check URL or network"
else
    echo "⚠️  Site returned HTTP $HTTP_CODE"
fi

echo ""
echo "🔧 Recent commits that should trigger deployment:"
git log --oneline -3

echo ""
echo "📊 Deployment status indicators:"
echo "✅ pnpm-lock.yaml: $([ -f hr-recruitment-platform/pnpm-lock.yaml ] && echo 'Present' || echo 'Missing')"
echo "✅ package.json: $([ -f hr-recruitment-platform/package.json ] && echo 'Present' || echo 'Missing')"
echo "✅ netlify.toml: $([ -f netlify.toml ] && echo 'Present' || echo 'Missing')"

echo ""
echo "⏰ Next check in 30 seconds..."
echo "🔄 Run this script again to monitor progress"