/**
 * Ilumina Improvement Factory - Agent Handshake & Communication Protocol
 * Defines the contract, handshake payloads, and ACK/NACK structures.
 */

export type AgentRole = 'analyst' | 'developer' | 'qa' | 'reporter';

export interface AgentHandshakePayload {
  handshakeId: string;
  sender: string;
  receiver: string;
  contractVersion: string;
  role: AgentRole;
  capabilities: string[];
  timestamp: number;
}

export interface AgentAckResponse {
  handshakeId: string;
  status: 'ACK' | 'NACK';
  sessionId: string;
  assignedTask?: string;
  error?: string;
  timestamp: number;
}

export interface ImprovementTask {
  id: string;
  title: string;
  targetFile: string;
  status: 'pending' | 'in_progress' | 'verified' | 'failed';
  details?: string;
}

export interface PipelineResult {
  sessionId: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  tasks: ImprovementTask[];
  timestamp: number;
}
