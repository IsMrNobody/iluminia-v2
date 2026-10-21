import React, { useState } from "react";
import { TeacherProfile } from "../types";
import { isUserAdmin } from "../lib/adminService";
import { 
  PolaroidAvatar, 
  MedalCounter, 
  GemProgressBar 
} from "./BitacoraBrand";
import { 
  User, 
  ShieldCheck, 
  Settings, 
  Bell, 
  Calendar, 
  ChevronRight, 
  LogOut, 
  UserPlus, 
  Lock,
  BookOpen
} from "lucide-react";

interface ProfileViewProps {
  teacher: TeacherProfile;
  classAveragePerformance: number;
  totalStudentsCount: number;
  onLogout: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToAdmin?: () => void;
}

export default function ProfileView({
  teacher,
  classAveragePerformance,
  totalStudentsCount,
  onLogout,
  onNavigateToRegister,
  onNavigateToAdmin
}: ProfileViewProps) {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const isAdmin = isUserAdmin(teacher);

  const termProgress = teacher.termProgressPercent || 50;

  const configOptions = [
    {
      title: "Información personal",
      subtitle: "Datos de contacto, rango y departamento",
      icon: <User className="w-6 h-6" />
    },
    {
      title: "Seguridad y credenciales",
      subtitle: "Contraseña institucional y firma digital",
      icon: <Lock className="w-6 h-6" />
    },
    {
      title: "Notificaciones y alertas",
      subtitle: "Avisos de calificaciones pendientes y plazos",
      icon: <Bell className="w-6 h-6" />
    },
    {
      title: "Calendario escolar",
      subtitle: `Periodo académico ${teacher.schoolYear || "2025–2026"}`,
      icon: <Calendar className="w-6 h-6" />
    }
  ];

  return (
    <div className="space-y-8">
      {/* Settings Informational Modal */}
      {activeDialog && (
        <div className="fixed inset-0 bg-[#2B2623]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-sm w-full bg-white space-y-4">
            <h3 className="font-display text-lg text-[#2B2623] flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#D97706]" />
              {activeDialog}
            </h3>
            <p className="sub leading-relaxed">
              La configuración del expediente docente está gestionada por la dirección institucional. Para modificar datos oficiales contacta con el administrador escolar.
            </p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveDialog(null)}
                className="btn s"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Profile Stitched Card */}
      <section className="card sti co pp bg-white">
        <div className="row items-center gap-7">
          {/* Large Polaroid Photo Frame */}
          <PolaroidAvatar 
            avatarUrl={teacher.avatarUrl}
            alt={teacher.name}
            size={110}
            rotation="-2deg"
          />

          <div className="flex-1 min-w-[240px]">
            <h1 className="font-display text-2xl sm:text-3xl text-[#2B2623]">
              {teacher.name}
            </h1>
            <p className="sub my-2">
              Área: {teacher.department} · Periodo {teacher.schoolYear || "2025–2026"}
            </p>

            <div className="row gap-2 pt-1">
              <span 
                className="bg vio"
                style={{ background: "#E0E7FF", color: "#3730A3", borderColor: "#A5B4FC" }}
              >
                {teacher.rank || "Docente Titular"}
              </span>

              <span className="bg ok">
                {teacher.status || "Activo"}
              </span>

              {isAdmin && (
                <span className="bg adm flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#92400E]" />
                  Administrador
                </span>
              )}
            </div>
          </div>

          {/* Medals */}
          <div className="row full-m justify-center gap-4">
            <MedalCounter
              value={totalStudentsCount}
              label="Alumnos"
              spriteName="birrete"
            />
            <MedalCounter
              value={classAveragePerformance > 0 ? classAveragePerformance.toFixed(1) : "—"}
              label="Promedio /20"
              spriteName="medalla"
              valueColor={classAveragePerformance >= 16 ? "#15803D" : classAveragePerformance >= 10 ? "#854D0E" : "#B91C1C"}
            />
          </div>
        </div>

        {/* Lapso Academic Progress */}
        <div className="mt-8 pt-6 border-t border-[#E5DCD0]">
          <div className="flex justify-between items-center text-xs font-semibold text-[#6E655F] uppercase tracking-wider font-mono">
            <span>Progreso del Lapso Activo</span>
            <b className="text-[#2B2623] text-sm">{termProgress}%</b>
          </div>
          <GemProgressBar 
            percent={termProgress} 
            barColor="#22C55E" 
            className="mt-2"
          />
        </div>
      </section>

      {/* Configuration Grid */}
      <div>
        <h2 className="font-display text-2xl text-[#2B2623] mb-4">
          Configuración
        </h2>

        <div className="g" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
          {configOptions.map((opt) => (
            <div
              key={opt.title}
              onClick={() => setActiveDialog(opt.title)}
              className="card opt bg-white"
            >
              <span className="ib">
                {opt.icon}
              </span>
              <div className="flex-1 min-w-0">
                <b className="truncate">{opt.title}</b>
                <span className="sub truncate block">{opt.subtitle}</span>
              </div>
              <ChevronRight className="w-5 h-5 text-[#CDB993] shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="row gap-4 pt-2">
        {isAdmin && onNavigateToAdmin && (
          <button 
            onClick={onNavigateToAdmin}
            className="btn d full-m"
          >
            <ShieldCheck className="w-5 h-5 text-[#F4DFA6]" />
            <span>Panel de administrador</span>
          </button>
        )}

        {onNavigateToRegister && (
          <button 
            onClick={onNavigateToRegister}
            className="btn s full-m"
          >
            <UserPlus className="w-5 h-5 text-[#D97706]" />
            <span>Registrar nuevo docente / cambiar cuenta</span>
          </button>
        )}

        <button 
          onClick={onLogout}
          className="btn danger full-m"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
