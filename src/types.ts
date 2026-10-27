export interface ProjectFile {
  path: string;
  description: string;
  content: string;
  versionHistory?: string[];
}

export interface ProjectConfig {
  id: string;
  name: string;
  packageName: string;
  minSdk: number;
  targetSdk: number;
  selectedIdeas: string[];
  updatedAt: string;
  versionCode?: number;
  versionName?: string;
  permissions?: string[];
  notes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  ideaTag?: string;
  generatedCode?: {
    summary: string;
    snippet: string;
    filesUpdatedCount: number;
  };
}

export interface FeatureIdea {
  id: string;
  title: string;
  category: string;
  description: string;
  promptTemplate: string;
  codeEnhancementHint: string;
}

export type CommandCategory = 'setup' | 'bootstrap' | 'file' | 'troubleshoot';

export interface CommandHistoryEntry {
  id: string;
  title: string;
  category: CommandCategory;
  projectName: string;
  command: string;
  pinned: boolean;
  timestamp: string;
}

export interface TermuxTip {
  id: string;
  title: string;
  symptom: string;
  cause: string;
  command: string;
  category: string;
}
