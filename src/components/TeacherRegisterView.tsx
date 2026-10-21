import React, { useState } from "react";
import { 
  Sparkles, 
  Mail, 
  Lock, 
  GraduationCap, 
  School, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  UserPlus, 
  LogIn, 
  ShieldCheck, 
  RefreshCw,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  registerTeacherInSupabase, 
  loginTeacherWithSupabase
} from "../lib/supabase";
import { getCurrentSchoolYear } from "../lib/adminService";
import { TeacherProfile, ClassSection } from "../types";
import { IluminaLogo } from "./BitacoraBrand";
import { motion } from "motion/react";

interface TeacherRegisterViewProps {
  onRegisterSuccess: (teacher: TeacherProfile, initialClasses?: ClassSection[] | ClassSection, message?: string) => void;
  onCancel?: () => void;
  currentTeacherName?: string;
}

const PRESET_AVATARS = [
  "https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=200&auto=format&fit=crop&q=80",
];

export default function TeacherRegisterView({
  onRegisterSuccess,
  onCancel,
  currentTeacherName
}: TeacherRegisterViewProps) {
  // Mode: "login" by default for returning teachers, or "register" for new teachers
  const [mode, setMode] = useState<"login" | "register">("login");
  
  // Login form fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Registration form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [department, setDepartment] = useState("Ciencias Exactas");
  const [rank, setRank] = useState("Docente Titular");
  const [schoolYear, setSchoolYear] = useState(getCurrentSchoolYear());
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  
  // Initial subject fields - default to false so new teachers without assigned subjects start with 0
  const [createInitialClass, setCreateInitialClass] = useState(false);
  const [subjectName, setSubjectName] = useState("Matemáticas");
  const [gradeYear, setGradeYear] = useState("2do Año");
  const [sectionLetter, setSectionLetter] = useState("A");
  const [initialSections, setInitialSections] = useState<string[]>(["A", "B", "C", "D", "E", "F"]);

  // Loading and feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!loginEmail.trim() || !loginEmail.includes("@")) {
      setErrorMessage("Ingresa un correo institucional.");
      return;
    }
    if (!loginPassword) {
      setErrorMessage("Ingresa tu contraseña.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginTeacherWithSupabase(loginEmail.trim(), loginPassword);
      setIsLoading(false);

      if (result.success && result.teacher) {
        onRegisterSuccess(
          result.teacher, 
          result.classes || [], 
          result.message
        );
      } else {
        setErrorMessage(result.message || "Credenciales incorrectas.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || "Error al iniciar sesión.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Ingresa tu nombre y apellido.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Ingresa un correo institucional.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Contraseña mínimo 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerTeacherInSupabase({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        department: department.trim(),
        rank: rank.trim(),
        schoolYear: schoolYear.trim(),
        avatarUrl: avatarUrl.trim(),
        initialSubjectName: createInitialClass ? subjectName.trim() : undefined,
        initialGradeYear: createInitialClass ? gradeYear.trim() : undefined,
        initialSectionLetter: createInitialClass ? (initialSections[0] || "A") : undefined,
        initialSections: createInitialClass ? initialSections : undefined,
      });

      setIsLoading(false);

      if (result.success) {
        onRegisterSuccess(
          result.teacher, 
          result.newClasses || (result.newClass ? [result.newClass] : []), 
          "¡Registro exitoso!"
        );
      } else {
        setErrorMessage(result.message || "Error al registrar docente.");
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || "Error al registrar docente.");
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 md:px-8 max-w-xl mx-auto space-y-6 flex flex-col justify-center">
      {/* Brand Logo & Title */}
      <div className="text-center space-y-2">
        <IluminaLogo size={80} className="mx-auto" />
        <h1 className="font-display text-3xl text-[#2B2623]">
          Ilumina · Bitácora del Docente
        </h1>
        <p className="sub text-sm">
          Gestión de calificaciones, planillas y seguimiento académico
        </p>
      </div>

      {/* Mode Switcher Chips */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => { setMode("login"); setErrorMessage(""); }}
          className={`chip ${mode === "login" ? "am" : ""}`}
        >
          <LogIn className="w-4 h-4" />
          <span>Iniciar Sesión</span>
        </button>

        <button
          type="button"
          onClick={() => { setMode("register"); setErrorMessage(""); }}
          className={`chip ${mode === "register" ? "am" : ""}`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Docente</span>
        </button>
      </div>

      {/* Error Message Toast */}
      {errorMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs font-semibold flex items-center gap-3 shadow-sm"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </motion.div>
      )}

      {/* MODE 1: LOGIN FORM */}
      {mode === "login" ? (
        <div className="card sti co pp bg-white space-y-6">
          <div className="space-y-1 pb-3 border-b border-[#E5DCD0]">
            <h2 className="font-display text-xl text-[#2B2623] flex items-center gap-2">
              <LogIn className="w-5 h-5 text-[#D97706]" />
              Ingreso con Credenciales
            </h2>
            <p className="sub text-xs">
              Ingresa tu correo institucional y contraseña para entrar a tu bitácora docente.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Correo Electrónico Institucional *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="ejemplo: profesor@ilumina.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Contraseña de Acceso *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showLoginPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs font-semibold pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => { setMode("register"); setErrorMessage(""); }}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer order-2 sm:order-1"
              >
                ¿No tienes una cuenta aún? Regístrate aquí
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="btn w-full sm:w-auto disabled:opacity-50 order-1 sm:order-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* MODE 2: REGISTRATION FORM */
        <form onSubmit={handleRegisterSubmit} className="space-y-6">
          {/* Info pill about centralized registry */}
          <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-center gap-3 text-blue-900">
            <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-xs">
              <span className="font-extrabold block">Ficha Académica del Docente</span>
              <span className="text-blue-700">Gestiona tus asignaturas a cargo, planillas de evaluación y nómina de estudiantes.</span>
            </div>
          </div>

          {/* Section 1: Personal and Institutional Information */}
          <div className="card sti co pp bg-white space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-[#E5DCD0]">
              <GraduationCap className="w-5 h-5 text-[#D97706]" />
              <h2 className="font-display text-lg text-[#2B2623]">
                1. Información Personal e Institucional
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nombre Completo del Profesor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Prof. Leonardo Da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Correo Electrónico Institucional *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="profesor@ilumina.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Contraseña de Acceso (mín. 6 caracteres) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs font-semibold pl-9 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showRegisterPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Departamento / Área de Cátedra
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 transition cursor-pointer"
                >
                  <option value="Ciencias Exactas">Ciencias Exactas (Matemáticas, Física, Química)</option>
                  <option value="Humanidades y Lenguaje">Humanidades y Lenguaje (Castellano, Literatura, Inglés)</option>
                  <option value="Ciencias Sociales">Ciencias Sociales, Geografía e Historia</option>
                  <option value="Artes y Creación">Artes, Expresión y Cultura</option>
                  <option value="Educación Física">Educación Física y Salud</option>
                  <option value="Tecnología e Informática">Tecnología e Informática</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Rango o Cargo Académico
                </label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 focus:border-blue-600 transition cursor-pointer"
                >
                  <option value="Docente Titular">Docente Titular</option>
                  <option value="Docente Senior">Docente Senior</option>
                  <option value="Docente Adjunto">Docente Adjunto</option>
                  <option value="Coordinador de Nivel">Coordinador de Nivel</option>
                  <option value="Jefe de Departamento">Jefe de Departamento</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Año Escolar Vigente
                </label>
                <input
                  type="text"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                  placeholder={getCurrentSchoolYear()}
                  className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 transition"
                />
              </div>
            </div>

            {/* Avatar Selection */}
            <div className="pt-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">
                Selecciona tu Avatar Docente
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {PRESET_AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`relative rounded-full p-0.5 transition cursor-pointer ${
                      avatarUrl === url
                        ? "ring-3 ring-blue-600 scale-105"
                        : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Avatar ${i}`}
                      className="w-12 h-12 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {avatarUrl === url && (
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Initial Subject Configuration */}
          <div className="card sti co pp bg-white space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5DCD0]">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-[#D97706]" />
                <h2 className="font-display text-lg text-[#2B2623]">
                  2. Asignatura y Aula Inicial
                </h2>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-[#6E655F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={createInitialClass}
                  onChange={(e) => setCreateInitialClass(e.target.checked)}
                  className="w-4 h-4 text-[#D97706] rounded focus:ring-[#D97706] cursor-pointer"
                />
                Crear primera clase de inmediato
              </label>
            </div>

            {createInitialClass && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Materia Asignada
                  </label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    placeholder="Ej: Matemáticas"
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Grado o Nivel
                  </label>
                  <select
                    value={gradeYear}
                    onChange={(e) => setGradeYear(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="1er Año">1er Año</option>
                    <option value="2do Año">2do Año</option>
                    <option value="3er Año">3er Año</option>
                    <option value="4to Año">4to Año</option>
                    <option value="5to Año">5to Año</option>
                    <option value="6to Grado">6to Grado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Secciones Asignadas
                  </label>
                  <select
                    value={
                      initialSections.length === 6 && ["A", "B", "C", "D", "E", "F"].every(s => initialSections.includes(s))
                        ? "ALL"
                        : initialSections.length === 4 && ["A", "B", "C", "D"].every(s => initialSections.includes(s))
                        ? "ABCD"
                        : initialSections.length === 3 && ["A", "B", "C"].every(s => initialSections.includes(s))
                        ? "ABC"
                        : initialSections.length === 1
                        ? initialSections[0]
                        : "CUSTOM"
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "ALL") setInitialSections(["A", "B", "C", "D", "E", "F"]);
                      else if (val === "ABCD") setInitialSections(["A", "B", "C", "D"]);
                      else if (val === "ABC") setInitialSections(["A", "B", "C"]);
                      else setInitialSections([val]);
                    }}
                    className="w-full text-xs font-semibold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-blue-600 cursor-pointer"
                  >
                    <option value="ALL">Todas las secciones (A a F) — Por defecto</option>
                    <option value="ABCD">Secciones (A, B, C, D)</option>
                    <option value="ABC">Secciones (A, B, C)</option>
                    <option value="A">Solo Sección A</option>
                    <option value="B">Solo Sección B</option>
                    <option value="C">Solo Sección C</option>
                    <option value="D">Solo Sección D</option>
                    <option value="E">Solo Sección E</option>
                    <option value="F">Solo Sección F</option>
                    <option value="U">Sección Única (U)</option>
                  </select>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {["A", "B", "C", "D", "E", "F"].map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => {
                          setInitialSections(prev => 
                            prev.includes(sec)
                              ? (prev.length > 1 ? prev.filter(s => s !== sec) : prev)
                              : [...prev, sec].sort()
                          );
                        }}
                        className={`chip ${initialSections.includes(sec) ? "am" : ""}`}
                      >
                        {initialSections.includes(sec) ? `✓ Sec. ${sec}` : `Sec. ${sec}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => { setMode("login"); setErrorMessage(""); }}
              className="chip"
            >
              ¿Ya tienes cuenta? Inicia sesión aquí
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="btn full-m disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registrando docente...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Registrar Docente e Ingresar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
