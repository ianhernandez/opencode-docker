/**
 * TypeScript types for OpenCode API
 * Based on OpenCode REST API documentation
 */

export interface Session {
  id: string;
  title: string;
  parentID?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  sessionID: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

export interface TextPart {
  type: 'text';
  text: string;
}

export interface ToolPart {
  type: 'tool';
  name: string;
  input: any;
  output?: any;
}

export type Part = TextPart | ToolPart;

export interface MessageWithParts {
  info: Message;
  parts: Part[];
}

export interface Model {
  providerID: string;
  modelID: string;
}

export interface CreateSessionRequest {
  title?: string;
  parentID?: string;
}

export interface SendMessageRequest {
  model: Model;
  agent: string;
  parts: TextPart[];
  messageID?: string;
  noReply?: boolean;
  system?: string;
}

export interface SessionStatus {
  type: 'idle' | 'busy' | 'retry';
  attempt?: number;
  message?: string;
  next?: string;
}

export interface Agent {
  name: string;
  description?: string;
  model?: Model;
}

// SSE Event types
export interface MessageUpdatedEvent {
  type: 'message.updated';
  properties: {
    info: Message;
    parts?: Part[];
  };
}

export interface MessagePartUpdatedEvent {
  type: 'message.part.updated';
  properties: {
    messageID: string;
    part: Part;
    delta?: string;
  };
}

export interface SessionStatusEvent {
  type: 'session.status';
  properties: {
    sessionID: string;
    status: SessionStatus;
  };
}

export type OpenCodeEvent =
  | MessageUpdatedEvent
  | MessagePartUpdatedEvent
  | SessionStatusEvent;
