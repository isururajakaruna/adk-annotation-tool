/**
 * Session-based logging utility
 * Logs all SSE events to files per session for debugging
 */

import fs from 'fs';
import path from 'path';

export class SessionLogger {
  private sessionId: string;
  private logDir: string;
  private logFile: string;
  private rawEventsFile: string;
  private enabled: boolean;

  constructor(sessionId: string, enabled: boolean = true) {
    this.sessionId = sessionId;
    this.enabled = enabled;
    
    // Create logs directory in project root
    this.logDir = path.join(process.cwd(), 'logs');
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Create log files
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('Z')[0];
    this.logFile = path.join(this.logDir, `session_${this.sessionId}_${timestamp}_${timeStr}.log`);
    this.rawEventsFile = path.join(this.logDir, `raw_events_${this.sessionId}_${timestamp}_${timeStr}.json`);
    
    // Initialize files
    this.log('SESSION_START', `Session ${sessionId} started`);
    this.writeRawEvent({ type: 'SESSION_START', timestamp: Date.now(), sessionId });
  }

  log(level: string, message: string, data?: any) {
    if (!this.enabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
    
    try {
      fs.appendFileSync(this.logFile, logEntry);
    } catch (error) {
      console.error('[SessionLogger] Failed to write log:', error);
    }
  }

  writeRawEvent(event: any) {
    if (!this.enabled) return;

    try {
      const eventWithTimestamp = {
        ...event,
        logged_at: new Date().toISOString(),
      };
      
      // Append to JSON array file
      let events: any[] = [];
      if (fs.existsSync(this.rawEventsFile)) {
        const content = fs.readFileSync(this.rawEventsFile, 'utf-8');
        if (content.trim()) {
          events = JSON.parse(content);
        }
      }
      
      events.push(eventWithTimestamp);
      fs.writeFileSync(this.rawEventsFile, JSON.stringify(events, null, 2));
    } catch (error) {
      console.error('[SessionLogger] Failed to write raw event:', error);
    }
  }

  logAgentEngineRawEvent(event: any) {
    this.log('AGENT_ENGINE_RAW', 'Raw event from Agent Engine', event);
    this.writeRawEvent({ source: 'AGENT_ENGINE', event });
  }

  logParsedEvent(eventType: string, data: any) {
    this.log('PARSED_EVENT', `Event type: ${eventType}`, data);
    this.writeRawEvent({ source: 'PARSED', type: eventType, data });
  }

  logSSESent(event: any) {
    this.log('SSE_SENT', 'SSE event sent to frontend', event);
    this.writeRawEvent({ source: 'SSE_SENT', event });
  }

  logError(context: string, error: any) {
    this.log('ERROR', `Error in ${context}`, error instanceof Error ? error.message : error);
    this.writeRawEvent({ source: 'ERROR', context, error: error instanceof Error ? error.message : String(error) });
  }

  complete() {
    this.log('SESSION_END', `Session ${this.sessionId} completed`);
    this.writeRawEvent({ type: 'SESSION_END', timestamp: Date.now(), sessionId: this.sessionId });
  }
}

// Session logger storage
const sessionLoggers = new Map<string, SessionLogger>();

export function getSessionLogger(sessionId: string): SessionLogger {
  if (!sessionLoggers.has(sessionId)) {
    const logger = new SessionLogger(sessionId);
    sessionLoggers.set(sessionId, logger);
    
    // Clean up after 1 hour
    setTimeout(() => {
      sessionLoggers.delete(sessionId);
    }, 60 * 60 * 1000);
  }
  
  return sessionLoggers.get(sessionId)!;
}

export function completeSessionLogger(sessionId: string) {
  const logger = sessionLoggers.get(sessionId);
  if (logger) {
    logger.complete();
    sessionLoggers.delete(sessionId);
  }
}


