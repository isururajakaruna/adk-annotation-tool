#!/bin/bash

# Test script for Agent Engine Sessions API
# Make sure you're logged in with: gcloud auth login

# Load config from .agent-config.json or .env
if [ -f ".agent-config.json" ]; then
    echo "📄 Loading config from .agent-config.json"
    
    # Check if jq is available
    if command -v jq &> /dev/null; then
        PROJECT_ID=$(jq -r '.projectId' .agent-config.json)
        LOCATION=$(jq -r '.location' .agent-config.json)
        AGENT_ID=$(jq -r '.agentId' .agent-config.json)
    else
        # Fallback to grep if jq is not available
        PROJECT_ID=$(cat .agent-config.json | grep -o '"projectId":"[^"]*"' | cut -d'"' -f4)
        LOCATION=$(cat .agent-config.json | grep -o '"location":"[^"]*"' | cut -d'"' -f4)
        AGENT_ID=$(cat .agent-config.json | grep -o '"agentId":"[^"]*"' | cut -d'"' -f4)
    fi
elif [ -f ".env" ]; then
    echo "📄 Loading config from .env"
    source .env
    PROJECT_ID=$AGENT_ENGINE_PROJECT_ID
    LOCATION=$AGENT_ENGINE_LOCATION
    AGENT_ID=$AGENT_ENGINE_RESOURCE_ID
else
    echo "❌ No config file found (.agent-config.json or .env)"
    exit 1
fi

echo "🔧 Configuration:"
echo "  Project ID: $PROJECT_ID"
echo "  Location: $LOCATION"
echo "  Agent ID: $AGENT_ID"
echo ""

# Get access token
TOKEN=$(gcloud auth print-access-token)
if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get access token. Run: gcloud auth login"
    exit 1
fi

BASE_URL="https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${AGENT_ID}"

# Function to list sessions
list_sessions() {
    echo "📋 Listing all sessions..."
    curl -s -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "${BASE_URL}/sessions" | jq '.'
}

# Function to create a session using ADK's async_create_session
create_session() {
    local USER_ID=$1
    echo "🆕 Creating ADK session for user: $USER_ID" >&2
    
    PAYLOAD=$(cat <<EOF
{
  "class_method": "async_create_session",
  "input": {
    "user_id": "${USER_ID}"
  }
}
EOF
)
    
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        "${BASE_URL}:query")
    
    echo "$RESPONSE" | jq '.' >&2
    
    # Extract session ID from output.id
    SESSION_ID=$(echo "$RESPONSE" | jq -r '.output.id // empty')
    
    if [ -z "$SESSION_ID" ]; then
        echo "❌ Failed to extract session ID from response" >&2
        return 1
    fi
    
    echo "" >&2
    echo "✅ ADK Session ID: $SESSION_ID" >&2
    
    # Return just the session ID
    echo "$SESSION_ID"
}

# Function to get a specific session
get_session() {
    local SESSION_ID=$1
    echo "🔍 Getting session: $SESSION_ID"
    curl -s -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "${BASE_URL}/sessions/${SESSION_ID}" | jq '.'
}

# Function to delete a session
delete_session() {
    local SESSION_ID=$1
    echo "🗑️  Deleting session: $SESSION_ID"
    curl -s -X DELETE \
        -H "Authorization: Bearer $TOKEN" \
        "${BASE_URL}/sessions/${SESSION_ID}"
    echo "✅ Deleted"
}

# Function to test query with session
test_query() {
    local SESSION_ID=$1
    local MESSAGE=$2
    local USER_ID=${3:-"test-user"}
    
    echo "💬 Testing query with ADK session: $SESSION_ID"
    echo "   Message: $MESSAGE"
    echo "   User ID: $USER_ID"
    
    PAYLOAD=$(cat <<EOF
{
  "input": {
    "message": "${MESSAGE}",
    "user_id": "${USER_ID}",
    "session_id": "${SESSION_ID}"
  },
  "class_method": "async_stream_query"
}
EOF
)
    
    echo "📤 Payload:"
    echo "$PAYLOAD" | jq '.'
    echo ""
    
    # Use :streamQuery with session_id to maintain context
    ENDPOINT_URL="https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/reasoningEngines/${AGENT_ID}:streamQuery?alt=sse"
    echo "🎯 Endpoint: ${ENDPOINT_URL}" >&2
    echo "" >&2
    
    curl -X POST \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        "${ENDPOINT_URL}"
}

# Main menu
case "$1" in
    list)
        list_sessions
        ;;
    create)
        if [ -z "$2" ]; then
            echo "Usage: $0 create <user_id>"
            exit 1
        fi
        create_session "$2"
        ;;
    get)
        if [ -z "$2" ]; then
            echo "Usage: $0 get <session_id>"
            exit 1
        fi
        get_session "$2"
        ;;
    delete)
        if [ -z "$2" ]; then
            echo "Usage: $0 delete <session_id>"
            exit 1
        fi
        delete_session "$2"
        ;;
    query)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: $0 query <session_id> <message>"
            exit 1
        fi
        test_query "$2" "$3"
        ;;
    test)
        echo "🧪 Running full context test..."
        echo ""
        
        # Create a test session
        USER_ID="test-user-$(date +%s)"
        SESSION_ID=$(create_session "$USER_ID")
        
        if [ -z "$SESSION_ID" ]; then
            echo "❌ Failed to create session"
            exit 1
        fi
        
        echo ""
        echo "📝 ADK Session ID: $SESSION_ID"
        echo "📝 User ID: $USER_ID"
        echo ""
        
        # First message
        echo "💬 Message 1: Establishing context..."
        test_query "$SESSION_ID" "My name is Alice and I like red cars" "$USER_ID" | head -5
        
        echo ""
        echo "⏳ Waiting before second message..."
        sleep 2
        echo ""
        
        # Second message - test if context is maintained
        echo "💬 Message 2: Testing context..."
        test_query "$SESSION_ID" "What is my name and what color do I like?" "$USER_ID"
        
        echo ""
        echo "✅ Test complete. ADK Session ID: $SESSION_ID"
        echo "   User ID: $USER_ID"
        ;;
    *)
        echo "Usage: $0 {list|create|get|delete|query|test}"
        echo ""
        echo "Commands:"
        echo "  list                      - List all sessions"
        echo "  create <user_id>          - Create a new session"
        echo "  get <session_id>          - Get session details"
        echo "  delete <session_id>       - Delete a session"
        echo "  query <session_id> <msg>  - Test a query with session"
        echo "  test                      - Run full test (create + query)"
        echo ""
        echo "Examples:"
        echo "  $0 list"
        echo "  $0 create my-user-123"
        echo "  $0 query 1234567890 'Hello'"
        echo "  $0 test"
        exit 1
        ;;
esac

