/**
 * OpenCode API Client for React Router Server-Side
 * Connects to OpenCode server at port 4096
 */

import type {
  Session,
  MessageWithParts,
  CreateSessionRequest,
  SendMessageRequest,
  Agent,
} from './opencode-types';

// OpenCode runs on port 4096
// In Docker: http://opencode:4096
// Local dev: http://localhost:4096
const OPENCODE_BASE_URL = process.env.OPENCODE_URL || 'http://localhost:4096';

// Default directory - you can make this configurable
const DEFAULT_DIRECTORY = '/workspace';

interface OpenCodeRequestOptions extends RequestInit {
  directory?: string;
}

async function opencodeRequest<T>(
  endpoint: string,
  options: OpenCodeRequestOptions = {}
): Promise<T> {
  const { directory = DEFAULT_DIRECTORY, ...fetchOptions } = options;

  // Add directory as query parameter
  const url = new URL(endpoint, OPENCODE_BASE_URL);
  url.searchParams.set('directory', directory);

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenCode API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Session Management
 */
export async function listSessions(directory?: string): Promise<Session[]> {
  return opencodeRequest<Session[]>('/session', { directory });
}

export async function createSession(
  data: CreateSessionRequest,
  directory?: string
): Promise<Session> {
  return opencodeRequest<Session>('/session', {
    method: 'POST',
    body: JSON.stringify(data),
    directory,
  });
}

export async function getSession(
  sessionId: string,
  directory?: string
): Promise<Session> {
  return opencodeRequest<Session>(`/session/${sessionId}`, { directory });
}

export async function deleteSession(
  sessionId: string,
  directory?: string
): Promise<void> {
  return opencodeRequest<void>(`/session/${sessionId}`, {
    method: 'DELETE',
    directory,
  });
}

/**
 * Message Management
 */
export async function listMessages(
  sessionId: string,
  limit: number = 50,
  directory?: string
): Promise<MessageWithParts[]> {
  const url = `/session/${sessionId}/message`;
  const response = await opencodeRequest<MessageWithParts[]>(url, {
    directory,
  });
  return response;
}

export async function sendMessage(
  sessionId: string,
  data: SendMessageRequest,
  directory?: string
): Promise<MessageWithParts> {
  return opencodeRequest<MessageWithParts>(`/session/${sessionId}/message`, {
    method: 'POST',
    body: JSON.stringify(data),
    directory,
  });
}

/**
 * Agent Management
 */
export async function listAgents(directory?: string): Promise<Agent[]> {
  return opencodeRequest<Agent[]>('/agent', { directory });
}

/**
 * Session Control
 */
export async function abortSession(
  sessionId: string,
  directory?: string
): Promise<void> {
  return opencodeRequest<void>(`/session/${sessionId}/abort`, {
    method: 'POST',
    directory,
  });
}

/**
 * Get the SSE event stream URL
 */
export function getEventStreamUrl(directory: string = DEFAULT_DIRECTORY): string {
  const url = new URL('/event', OPENCODE_BASE_URL);
  url.searchParams.set('directory', directory);
  return url.toString();
}
