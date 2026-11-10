/**
 * Ilumina Improvement Factory - Subagents Registry & Execution Definitions
 */

export interface SubagentDefinition {
  id: string;
  name: string;
  role: 'analyst' | 'developer' | 'qa';
  description: string;
  systemPrompt: string;
  capabilities: string[];
}

export const ILUMINA_SUBAGENTS: Record<string, SubagentDefinition> = {
  analyst: {
    id: 'agent-analyst-01',
    name: 'Analista de Código y Supabase',
    role: 'analyst',
    description: 'Revisa tipos TypeScript, consultas a Supabase y detecta posibles bugs o mejoras arquitectónicas.',
    systemPrompt: 'Eres el Agente Analista en la Fábrica de Mejoras de Ilumina. Tu trabajo es auditar código, verificar tipos y validar esquemas de datos.',
    capabilities: ['code-audit', 'type-check', 'supabase-inspect']
  },
  developer: {
    id: 'agent-developer-01',
    name: 'Desarrollador React & UI',
    role: 'developer',
    description: 'Refactoriza componentes React, aplica estilos Tailwind y repara problemas en la interfaz.',
    systemPrompt: 'Eres el Agente Desarrollador en la Fábrica de Mejoras de Ilumina. Tu trabajo es refactorizar componentes y aplicar parches limpios.',
    capabilities: ['react-refactor', 'ui-patch', 'tailwind-optimize']
  },
  qa: {
    id: 'agent-qa-01',
    name: 'QA y Verificador de Build',
    role: 'qa',
    description: 'Ejecuta validaciones de TypeScript, lints y compilación con Vite para asegurar cero regresiones.',
    systemPrompt: 'Eres el Agente QA en la Fábrica de Mejoras de Ilumina. Tu trabajo es verificar compilaciones, lints y garantizar calidad sin errores.',
    capabilities: ['tsc-verify', 'vite-build', 'regression-test']
  }
};

export function getSubagent(role: string): SubagentDefinition | undefined {
  return ILUMINA_SUBAGENTS[role];
}

export function getAllSubagents(): SubagentDefinition[] {
  return Object.values(ILUMINA_SUBAGENTS);
}
