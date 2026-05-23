#!/bin/bash

# Test MCP Server Script
# This script tests if the MCP server starts correctly

echo "🔧 Testing MCP Server..."
echo ""

# Check if the MCP server is built
if [ ! -f "apps/mcp-server/dist/index.js" ]; then
    echo "❌ MCP server not built. Building now..."
    npm run build --workspace=@devops-ai/mcp-server
fi

# Set test environment variables
export API_URL="${API_URL:-http://localhost:4000}"
export MCP_API_TOKEN="${MCP_API_TOKEN:-test-token}"
export MCP_LOG_LEVEL="debug"

echo "📋 Configuration:"
echo "   API_URL: $API_URL"
echo "   MCP_LOG_LEVEL: $MCP_LOG_LEVEL"
echo ""

# Test if the server starts and returns tools list
echo "🚀 Starting MCP server..."
OUTPUT=$(echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node apps/mcp-server/dist/index.js 2>&1)

if echo "$OUTPUT" | grep -q '"tools"'; then
    echo ""
    echo "✅ MCP server started successfully!"
    echo ""
    echo "� Available tools:"
    echo "$OUTPUT" | grep -o '"name":"[^"]*"' | sed 's/"name":"//g' | sed 's/"//g' | while read tool; do
        echo "   - $tool"
    done
    echo ""
    echo "�📝 Next steps:"
    echo "   1. Make sure your backend API is running: npm run dev --workspace=@devops-ai/api"
    echo "   2. Get an API token by logging in"
    echo "   3. Configure your IDE with the MCP settings (see docs/MCP_SETUP.md)"
else
    echo ""
    echo "❌ MCP server failed to start"
    echo "   Output: $OUTPUT"
fi
