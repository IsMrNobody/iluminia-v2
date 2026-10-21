import React, { useState, useEffect } from "react";
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  KeyRound, 
  Layers, 
  Table, 
  ArrowRight, 
  UploadCloud, 
  DownloadCloud, 
  Lock, 
  Sparkles,
  Info,
  Check,
  Server,
  Zap,
  Users,
  BookOpen,
  GraduationCap
} from "lucide-react";
import { 
  getSupabaseCredentials, 
  testSupabaseConnection, 
  seedDemoDataToSupabase, 
  SUPABASE_SQL_MIGRATION 
} from "../lib/supabase";
import { ClassSection, TeacherProfile } from "../types";

interface DatabaseViewProps {
  teacher: TeacherProfile;
  classes: ClassSection[];
  onDataSyncSuccess?: (message: string) => void;
}

export default function DatabaseView({
  teacher,
  classes,
  onDataSyncSuccess
}: DatabaseViewProps) {
  const [credentials, setCredentials] = useState(getSupabaseCredentials());
  const [isChecking, setIsChecking] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    message: string;
    tables: Record<string, boolean>;
    latencyMs: number;
  } | null>(null);

  const [copiedSQL, setCopiedSQL] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<"schema" | "security" | "sync" | "instructions">("schema");
  const [customUrl, setCustomUrl] = useState(credentials.url);
  const [customKey, setCustomKey] = useState(credentials.key);
  const [saveCustomConfig, setSaveCustomConfig] = useState(false);

  const [seedFeedback, setSeedFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Run test on mount
  useEffect(() => {
    handleTestConnection();
  }, []);

  const handleTestConnection = async () => {
    setIsChecking(true);
    try {
      const res = await testSupabaseConnection();
      setConnectionStatus(res);
    } catch (err: any) {
      setConnectionStatus({
        connected: false,
        message: err?.message || "No se pudo conectar a Supabase",
        tables: {},
        latencyMs: 0
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_MIGRATION);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(credentials.key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleSaveCredentials = () => {
    localStorage.setItem("ilumina_supabase_url", customUrl.trim());
    localStorage.setItem("ilumina_supabase_key", customKey.trim());
    setCredentials({ url: customUrl.trim(), key: customKey.trim() });
    setSaveCustomConfig(false);
    handleTestConnection();
  };

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedFeedback(null);
    const res = await seedDemoDataToSupabase(teacher, classes);
    setIsSeeding(false);
    if (res.success) {
      setSeedFeedback({ text: res.message, isError: false });
      if (onDataSyncSuccess) onDataSyncSuccess(res.message);
      handleTestConnection();
    } else {
      setSeedFeedback({ text: res.message, isError: true });
    }
  };

  const projectId = credentials.url.replace("https://", "").split(".")[0] || "wstssycklbopndiwjoyv";
  const supabaseSqlEditorUrl = `https://supabase.com/dashboard/project/${projectId}/sql/new`;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wider uppercase border border-blue-400/30">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              Conexión Directa a Supabase
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Gestión de Base de Datos & Tablas
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Conexión segura entre <strong className="text-white">Ilumina</strong> y tu instancia de PostgreSQL en Supabase.
              Estructura relacional optimizada para profesores, materias, alumnos y calificaciones por lapsos académicos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={isChecking}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Verificando..." : "Probar Conexión"}
            </button>
            <a
              href={supabaseSqlEditorUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs tracking-wider uppercase transition border border-white/10"
            >
              <ExternalLink className="w-4 h-4" />
              Abrir SQL Editor
            </a>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-850/60 rounded-xl p-3.5 border border-slate-800 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${connectionStatus?.connected ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
              {connectionStatus?.connected ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado del Endpoint</span>
              <p className="text-xs font-bold text-white truncate">
                {connectionStatus?.connected ? "API Supabase Activa" : "Desconectado"}
              </p>
            </div>
          </div>

          <div className="bg-slate-850/60 rounded-xl p-3.5 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Proyecto Supabase</span>
              <p className="text-xs font-mono font-bold text-white truncate" title={credentials.url}>
                {projectId}
              </p>
            </div>
          </div>

          <div className="bg-slate-850/60 rounded-xl p-3.5 border border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latencia de Respuesta</span>
              <p className="text-xs font-bold text-white">
                {connectionStatus?.latencyMs ? `${connectionStatus.latencyMs} ms` : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Info & Config Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Credenciales de Conexión Activa
            </h2>
            <p className="text-xs text-slate-500">
              Configuradas directamente con las claves de tu proyecto Supabase.
            </p>
          </div>
          <button
            onClick={() => setSaveCustomConfig(!saveCustomConfig)}
            className="text-xs text-blue-600 font-bold hover:underline self-start cursor-pointer"
          >
            {saveCustomConfig ? "Ocultar editor de claves" : "Editar claves manualmente"}
          </button>
        </div>

        {saveCustomConfig ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Supabase URL
              </label>
              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Supabase Publishable / Anon Key
              </label>
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveCredentials}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 cursor-pointer"
              >
                Guardar y Probar
              </button>
              <button
                onClick={() => {
                  setCustomUrl(credentials.url);
                  setCustomKey(credentials.key);
                  setSaveCustomConfig(false);
                }}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">URL del Endpoint</span>
                <p className="text-xs font-mono text-slate-800 truncate">{credentials.url}</p>
              </div>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                Configurado
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Publishable Key</span>
                <p className="text-xs font-mono text-slate-800 truncate">
                  {showKey ? credentials.key : credentials.key.slice(0, 16) + "••••••••••••••••"}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-xs text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
                  title={showKey ? "Ocultar" : "Mostrar"}
                >
                  {showKey ? "Ocultar" : "Ver"}
                </button>
                <button
                  onClick={handleCopyKey}
                  className="p-1 text-slate-500 hover:text-blue-600 cursor-pointer"
                  title="Copiar llave"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs for Database Setup */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-t-xl transition cursor-pointer ${
            activeTab === "schema"
              ? "bg-white text-blue-600 border-t-2 border-blue-600 border-x border-slate-200 -mb-px"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <Layers className="w-4 h-4" />
          1. Esquema Relacional & Tablas
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-t-xl transition cursor-pointer ${
            activeTab === "security"
              ? "bg-white text-blue-600 border-t-2 border-blue-600 border-x border-slate-200 -mb-px"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          2. Seguridad & RLS
        </button>

        <button
          onClick={() => setActiveTab("instructions")}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-t-xl transition cursor-pointer ${
            activeTab === "instructions"
              ? "bg-white text-blue-600 border-t-2 border-blue-600 border-x border-slate-200 -mb-px"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <Info className="w-4 h-4" />
          3. Paso a Paso en Supabase
        </button>

        <button
          onClick={() => setActiveTab("sync")}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-t-xl transition cursor-pointer ${
            activeTab === "sync"
              ? "bg-white text-blue-600 border-t-2 border-blue-600 border-x border-slate-200 -mb-px"
              : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          4. Semillero & Sincronización
        </button>
      </div>

      {/* Tab Content 1: Schema & Tables */}
      {activeTab === "schema" && (
        <div className="space-y-6">
          {/* Relational Schema Explanation */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              Estructura de Tablas Relacionales (PostgreSQL)
            </h3>
            <p className="text-xs text-slate-600">
              Para vincular eficientemente profesores, materias, alumnos y notas de forma ordenada, la base de datos utiliza una arquitectura relacional normalizada con claves foráneas e integridad referencial en cascada:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* Card Profesores */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                      1
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">profesores</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    Entidad Raíz
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Almacena el perfil del docente, vinculable opcionalmente con <code>auth.users</code> de Supabase Auth.
                </p>
                <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 space-y-0.5">
                  <div>• id (UUID, PK)</div>
                  <div>• nombre, email, departamento</div>
                  <div>• rango, ano_escolar, avatar_url</div>
                </div>
              </div>

              {/* Card Materias */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                      2
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">materias</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    Secciones
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Cada asignatura pertenece a un profesor (FK <code>profesor_id</code>) y tiene año, sección y lapso activo.
                </p>
                <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 space-y-0.5">
                  <div>• id (UUID, PK)</div>
                  <div>• profesor_id (FK → profesores)</div>
                  <div>• nombre, grado_ano, seccion</div>
                  <div>• lapso_activo (1, 2, 3)</div>
                </div>
              </div>

              {/* Card Alumnos */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      3
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">alumnos</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                    Estudiantes
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Catálogo central de estudiantes con cédula/código único para evitar duplicidades entre secciones.
                </p>
                <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 space-y-0.5">
                  <div>• id (UUID, PK)</div>
                  <div>• cedula (TEXT, UNIQUE)</div>
                  <div>• nombres, apellidos, avatar_url</div>
                </div>
              </div>

              {/* Card Matriculas */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                      4
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">matriculas</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                    Relación N:M
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Inscribe alumnos en materias, define el número de lista en la planilla y porcentaje de asistencia.
                </p>
                <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 space-y-0.5">
                  <div>• materia_id (FK → materias)</div>
                  <div>• alumno_id (FK → alumnos)</div>
                  <div>• numero_lista, asistencia_porcentaje</div>
                  <div>• UNIQUE(materia_id, alumno_id)</div>
                </div>
              </div>

              {/* Card Evaluaciones */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      5
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">evaluaciones</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                    Plan de Lapso
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Criterios ponderados de cada lapso (tareas 20%, montajes 20%, ensayos 20%, responsabilidad 5%, etc).
                </p>
                <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 space-y-0.5">
                  <div>• materia_id (FK → materias)</div>
                  <div>• lapso (1, 2, o 3)</div>
                  <div>• clave_item, titulo, categoria</div>
                  <div>• ponderacion_porcentaje (ej. 20)</div>
                </div>
              </div>

              {/* Card Calificaciones */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                      6
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">calificaciones</h4>
                  </div>
                  <span className="text-[10px] font-mono bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                    Notas 0-20
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Puntaje obtenido por cada alumno en cada evaluación con validación estricta de rango.
                </p>
                <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200 space-y-0.5">
                  <div>• evaluacion_id (FK)</div>
                  <div>• alumno_id (FK)</div>
                  <div>• nota (0.00 a 20.00)</div>
                  <div>• UNIQUE(evaluacion_id, alumno_id)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status of Tables in Supabase */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Table className="w-5 h-5 text-blue-600" />
                  Estado de Tablas en tu Supabase
                </h3>
                <p className="text-xs text-slate-500">
                  Detección en tiempo real de las colecciones creadas en tu proyecto.
                </p>
              </div>
              <button
                onClick={handleTestConnection}
                className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-escanear
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                "profesores",
                "materias",
                "alumnos",
                "matriculas",
                "evaluaciones",
                "calificaciones",
                "lapsos_config",
              ].map((tableName) => {
                const isFound = connectionStatus?.tables?.[tableName];
                return (
                  <div
                    key={tableName}
                    className={`p-3 rounded-xl border text-center transition ${
                      isFound
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span className="text-[11px] font-mono font-bold text-slate-800 block truncate">
                      {tableName}
                    </span>
                    <span
                      className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isFound
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {isFound ? "✓ Creada" : "Pendiente"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Warning if tables not created yet */}
            {connectionStatus?.connected && Object.values(connectionStatus.tables || {}).some(v => !v) && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">¡Las tablas aún no existen en tu Supabase!</p>
                  <p>
                    Para crearlas de inmediato, copia el script SQL provisto abajo, ve a tu{" "}
                    <a
                      href={supabaseSqlEditorUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-bold text-blue-700 inline-flex items-center gap-0.5"
                    >
                      SQL Editor en Supabase <ExternalLink className="w-3 h-3" />
                    </a>
                    , pégalo y haz clic en <strong>Run</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Copyable SQL Box */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Database className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">Script de Migración SQL para Supabase</span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                  PostgreSQL DDL + RLS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySQL}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  {copiedSQL ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSQL ? "¡Copiado al Portapapeles!" : "Copiar Script SQL"}
                </button>
              </div>
            </div>

            <div className="relative">
              <pre className="text-[11px] font-mono text-blue-200 bg-slate-950 p-4 rounded-xl overflow-x-auto max-h-72 border border-slate-800/80 leading-relaxed selection:bg-blue-600 selection:text-white">
                {SUPABASE_SQL_MIGRATION}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 2: Security & RLS */}
      {activeTab === "security" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Cómo garantizar una conexión 100% correcta y segura?
                </h3>
                <p className="text-xs text-slate-500">
                  Principios esenciales de seguridad para aplicaciones frontend conectadas a Supabase.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h4 className="font-bold text-sm text-emerald-950">
                    1. Llave Pública vs. Llave de Servicio
                  </h4>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Estás utilizando la <strong>Publishable Key (Anon Key)</strong>: <code>sb_publishable_...</code>. Esto es lo <strong>correcto y seguro</strong> para navegadores web.
                </p>
                <div className="text-[11px] bg-white p-3 rounded-lg border border-emerald-200 text-emerald-950">
                  <strong className="text-rose-600">⚠️ ADVERTENCIA CRÍTICA:</strong> Nunca coloques tu <code>service_role</code> secret en el código del frontend. La service role key bypassea todas las reglas de seguridad y solo debe usarse en servidores backend privados.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h4 className="font-bold text-sm text-blue-950">
                    2. Row Level Security (RLS) Activo
                  </h4>
                </div>
                <p className="text-xs text-blue-900 leading-relaxed">
                  PostgreSQL incluye <strong>Row Level Security</strong>. Cada tabla tiene:
                  <code className="block bg-white p-2 rounded border border-blue-200 text-[10px] my-1 font-mono">
                    ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
                  </code>
                  Esto garantiza que ninguna consulta REST pueda acceder a datos no autorizados, aun si alguien conoce tu clave pública.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h4 className="font-bold text-sm text-indigo-950">
                    3. Integridad y Restricciones (Constraints)
                  </h4>
                </div>
                <p className="text-xs text-indigo-900 leading-relaxed">
                  El esquema SQL contiene restricciones nativas en PostgreSQL:
                </p>
                <ul className="text-[11px] text-indigo-900 list-disc list-inside space-y-1">
                  <li><code>CHECK (nota &gt;= 0 AND nota &lt;= 20)</code>: Impide registrar notas inválidas.</li>
                  <li><code>CHECK (lapso IN (1, 2, 3))</code>: Garantiza que sólo existan los 3 lapsos académicos oficiales.</li>
                  <li><code>UNIQUE(materia_id, alumno_id)</code>: Evita duplicar un alumno en la misma clase.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h4 className="font-bold text-sm text-purple-950">
                    4. Vinculación con Supabase Auth (Opcional)
                  </h4>
                </div>
                <p className="text-xs text-purple-900 leading-relaxed">
                  En la tabla <code>profesores</code>, el campo <code>user_id UUID REFERENCES auth.users(id)</code> te permite vincular el inicio de sesión con correo y contraseña o Google OAuth de Supabase, haciendo que cada profesor sólo vea sus cursos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: Step-by-Step Instructions */}
      {activeTab === "instructions" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Guía Paso a Paso para Activar la Base de Datos
            </h3>
            <p className="text-xs text-slate-500">
              Sigue estos 3 sencillos pasos en tu panel de Supabase:
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">
                  Abre el Editor SQL de tu Proyecto en Supabase
                </h4>
                <p className="text-xs text-slate-600">
                  Ingresa al panel de control de Supabase con el proyecto <strong>{projectId}</strong> y navega a la sección <strong>SQL Editor</strong> en la barra lateral izquierda.
                </p>
                <div className="pt-2">
                  <a
                    href={supabaseSqlEditorUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition"
                  >
                    Abrir SQL Editor Directo <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">
                  Pega el Script SQL y haz clic en "RUN"
                </h4>
                <p className="text-xs text-slate-600">
                  Copia el script SQL que preparamos en la pestaña <strong>"1. Esquema Relacional"</strong>, pégalo en la ventana del editor y presiona el botón verde <strong>Run (Ctrl+Enter)</strong>. Supabase creará las 7 tablas, relaciones e índices en segundos.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleCopySQL}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition cursor-pointer"
                  >
                    {copiedSQL ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSQL ? "¡Copiado!" : "Copiar Script SQL"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </span>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">
                  ¡Listo! Verifica la Conexión y Siembra los Datos
                </h4>
                <p className="text-xs text-slate-600">
                  Regresa aquí y haz clic en <strong>"Probar Conexión"</strong>. Verás todas las tablas marcadas como <strong>✓ Creada</strong>. Luego ve a la pestaña <strong>"4. Semillero & Sincronización"</strong> para subir todas las materias y estudiantes de Ilumina con un solo clic.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Seed & Sync */}
      {activeTab === "sync" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-blue-600" />
              Semillero y Sincronización de Datos
            </h3>
            <p className="text-xs text-slate-500">
              Poblar la base de datos de Supabase con la información actual de las clases del profesor {teacher.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-sm text-slate-900">
                  Subir Datos Actuales de Ilumina a Supabase
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inserta automáticamente en Supabase:
              </p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• 1 Registro de Profesor (<strong>{teacher.name}</strong>)</li>
                <li>• {classes.length} Materias con sus secciones (Matemáticas, Física, etc.)</li>
                <li>• {classes.reduce((acc, c) => acc + c.students.length, 0)} Alumnos con sus cédulas y notas registradas</li>
                <li>• Criterios de evaluación y planillas de notas</li>
              </ul>
              {seedFeedback && (
                <div className={`p-3 rounded-lg text-xs font-medium ${seedFeedback.isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                  {seedFeedback.text}
                </div>
              )}
              <button
                onClick={handleSeedData}
                disabled={isSeeding}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wider uppercase transition shadow-md cursor-pointer disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isSeeding ? "animate-spin" : ""}`} />
                {isSeeding ? "Sincronizando con Supabase..." : "Poblar Base de Datos en Supabase"}
              </button>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-900">
                  Lectura en Tiempo Real
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                La conexión directa permite guardar cualquier nota que edites en las planillas de Ilumina directamente en la tabla <code>calificaciones</code> de Supabase para que tus notas estén permanentemente respaldadas en la nube.
              </p>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <span>Modo de sincronización</span>
                <span className="font-bold text-blue-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  Nativo + LocalStorage Fallback
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
