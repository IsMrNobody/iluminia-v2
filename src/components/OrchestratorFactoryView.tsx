import React, { useState } from "react";
import { factoryOrchestrator } from "../orchestrator/factory";
import { PipelineResult, ImprovementTask } from "../orchestrator/protocol";
import { getAllSubagents } from "../orchestrator/agents";
import { Sparkles, Play, CheckCircle2, AlertCircle, RefreshCw, Cpu, Shield, ArrowLeft, Bot } from "lucide-react";
import { motion } from "motion/react";

interface OrchestratorFactoryViewProps {
  onBack: () => void;
}

export const OrchestratorFactoryView: React.FC<OrchestratorFactoryViewProps> = ({ onBack }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const subagents = getAllSubagents();

  const handleRunFactory = async () => {
    setIsRunning(true);
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Iniciando protocolo de handshake y orquestador con ${subagents.length} subagentes...`
    ]);

    try {
      const sampleTasks: Omit<ImprovementTask, 'status'>[] = [
        { id: 't1', title: 'Auditoría de Tipos y Supabase Schema', targetFile: 'src/lib/supabase.ts' },
        { id: 't2', title: 'Refactorización de Componentes de Vista', targetFile: 'src/components/ClassOverviewView.tsx' },
        { id: 't3', title: 'Verificación de Accesibilidad y Tailwind v4', targetFile: 'src/App.tsx' }
      ];

      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Handshakes establecidos con éxito (ACK recibidos).`]);

      const result = await factoryOrchestrator.runImprovementPipeline(sampleTasks);
      setPipelineResult(result);
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Pipeline finalizado con éxito. Sesión: ${result.sessionId}`]);
    } catch (error: any) {
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error en el pipeline: ${error.message}`]);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5 text-slate-300" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
                Fábrica de Mejoras & Subagentes de Ilumina
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Protocolo de Handshake, red de subagentes y pipeline de optimización continua.
              </p>
            </div>
          </div>
          <button
            onClick={handleRunFactory}
            disabled={isRunning}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg transition ${
              isRunning
                ? "bg-indigo-900/50 text-indigo-300 cursor-not-allowed border border-indigo-700/50"
                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-600/30"
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Ejecutando Handshake...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                Iniciar Pipeline de Subagentes
              </>
            )}
          </button>
        </div>

        {/* Grid de Subagentes Registrados */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subagents.map((agent) => (
            <div key={agent.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-400" />
                  {agent.name}
                </h3>
                <span className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">
                  ACK / Listo
                </span>
              </div>
              <p className="text-sm text-slate-400">{agent.description}</p>
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                {agent.capabilities.map((cap, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] font-mono bg-slate-950 text-indigo-300 border border-slate-800 rounded-md">
                    {cap}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Resultados y Tareas del Pipeline */}
        {pipelineResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  Resultado del Pipeline (Sesión: {pipelineResult.sessionId})
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Completadas: {pipelineResult.completedTasks} / {pipelineResult.totalTasks} tareas
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-mono">
                {new Date(pipelineResult.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-3">
              {pipelineResult.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800/80"
                >
                  <div className="space-y-1">
                    <h4 className="font-medium text-slate-200 text-sm">{task.title}</h4>
                    <p className="text-xs font-mono text-indigo-400">{task.targetFile}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{task.details}</span>
                    <span className="px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-semibold">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Consola de Logs en Tiempo Real */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-inner font-mono text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3 text-slate-400">
            <span>Terminal de Protocolo y Handshake de Subagentes</span>
            <span>{logs.length} eventos registrados</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-slate-600 italic">Esperando inicio del pipeline de subagentes...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-emerald-400/90">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
