#!/usr/bin/env node

/**
 * Log Analyzer Script
 * Analyzes session logs to help debug SSE event issues
 */

const fs = require('fs');
const path = require('path');

const logsDir = path.join(__dirname, '..', 'logs');

function getLatestLogs() {
  if (!fs.existsSync(logsDir)) {
    console.error('❌ Logs directory not found:', logsDir);
    return null;
  }

  const files = fs.readdirSync(logsDir);
  const rawEventFiles = files
    .filter(f => f.startsWith('raw_events_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (rawEventFiles.length === 0) {
    console.error('❌ No log files found in:', logsDir);
    return null;
  }

  return path.join(logsDir, rawEventFiles[0]);
}

function analyzeLogs(logFile) {
  console.log('🔍 Analyzing logs:', path.basename(logFile));
  console.log('═'.repeat(80));

  const content = fs.readFileSync(logFile, 'utf-8');
  const events = JSON.parse(content);

  console.log(`\n📊 Total Events: ${events.length}\n`);

  // Count events by source
  const bySources = {};
  events.forEach(event => {
    const source = event.source || event.type || 'UNKNOWN';
    bySources[source] = (bySources[source] || 0) + 1;
  });

  console.log('📋 Events by Source:');
  Object.entries(bySources).forEach(([source, count]) => {
    console.log(`   ${source.padEnd(20)}: ${count}`);
  });

  // Check for tool calls
  const agentEngineEvents = events.filter(e => e.source === 'AGENT_ENGINE');
  const toolCallEvents = events.filter(e => e.type === 'tool_call');
  const toolResultEvents = events.filter(e => e.type === 'tool_result');
  const thinkingEvents = events.filter(e => e.type === 'thinking');
  const messageEvents = events.filter(e => e.type === 'message');

  console.log('\n🔧 Tool Call Analysis:');
  console.log(`   Raw Agent Engine events: ${agentEngineEvents.length}`);
  console.log(`   Tool call events sent: ${toolCallEvents.length}`);
  console.log(`   Tool result events sent: ${toolResultEvents.length}`);

  console.log('\n🧠 Thinking Analysis:');
  console.log(`   Thinking events sent: ${thinkingEvents.length}`);

  console.log('\n💬 Message Analysis:');
  console.log(`   Message events sent: ${messageEvents.length}`);

  // Check raw events for tool calls
  let rawToolCalls = 0;
  let rawThinking = 0;
  agentEngineEvents.forEach(e => {
    if (e.event && e.event.rawEvent) {
      const raw = e.event.rawEvent;
      if (raw.content && raw.content.parts) {
        raw.content.parts.forEach(part => {
          if (part.function_call) rawToolCalls++;
          if (part.thought_signature) rawThinking++;
        });
      }
    }
  });

  console.log('\n🔎 Raw Event Content:');
  console.log(`   function_call found: ${rawToolCalls}`);
  console.log(`   thought_signature found: ${rawThinking}`);

  // Check for issues
  console.log('\n⚠️  Issue Detection:');
  const issues = [];

  if (rawToolCalls > 0 && toolCallEvents.length === 0) {
    issues.push('Tool calls present in raw events but NOT sent to frontend');
  }

  if (rawThinking > 0 && thinkingEvents.length === 0) {
    issues.push('Thinking events present in raw events but NOT sent to frontend');
  }

  if (toolCallEvents.length > 0 && toolResultEvents.length === 0) {
    issues.push('Tool calls sent but no tool results received');
  }

  if (issues.length === 0) {
    console.log('   ✅ No issues detected');
  } else {
    issues.forEach((issue, i) => {
      console.log(`   ${i + 1}. ❌ ${issue}`);
    });
  }

  // Show sample events
  console.log('\n📝 Sample Events:\n');

  if (toolCallEvents.length > 0) {
    console.log('   Tool Call Event:');
    console.log('   ' + JSON.stringify(toolCallEvents[0], null, 2).split('\n').join('\n   '));
  }

  if (thinkingEvents.length > 0) {
    console.log('\n   Thinking Event:');
    console.log('   ' + JSON.stringify(thinkingEvents[0], null, 2).split('\n').join('\n   '));
  }

  if (agentEngineEvents.length > 0 && agentEngineEvents[0].event) {
    console.log('\n   Raw Agent Engine Event (first):');
    const sample = JSON.stringify(agentEngineEvents[0].event.rawEvent, null, 2);
    const lines = sample.split('\n').slice(0, 30); // First 30 lines
    console.log('   ' + lines.join('\n   '));
    if (sample.split('\n').length > 30) {
      console.log('   ... (truncated)');
    }
  }

  console.log('\n═'.repeat(80));
  console.log('✅ Analysis complete\n');
}

// Main
const args = process.argv.slice(2);
const logFile = args[0] ? path.join(logsDir, args[0]) : getLatestLogs();

if (!logFile) {
  console.error('\n❌ No logs to analyze');
  process.exit(1);
}

if (!fs.existsSync(logFile)) {
  console.error('❌ Log file not found:', logFile);
  process.exit(1);
}

analyzeLogs(logFile);

