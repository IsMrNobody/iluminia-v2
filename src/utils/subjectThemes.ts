export interface SubjectTheme {
  primary: string;         // e.g. "text-indigo-600"
  primaryHex: string;      // e.g. "#4f46e5"
  bgGradient: string;      // gradient for cover: e.g. "from-indigo-600 via-purple-700 to-slate-900"
  badgeBg: string;         // e.g. "bg-indigo-600"
  badgeText: string;       // e.g. "text-white"
  pillBg: string;          // e.g. "bg-indigo-50"
  pillText: string;        // e.g. "text-indigo-700"
  pillBorder: string;      // e.g. "border-indigo-200"
  pillHoverBg: string;     // e.g. "hover:bg-indigo-600 hover:text-white hover:border-indigo-600"
  accentBorder: string;    // e.g. "border-indigo-500"
  lightBg: string;         // e.g. "bg-indigo-50/70"
  btnBg: string;           // e.g. "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20"
  statText: string;        // e.g. "text-indigo-600"
}

// Predefined palette for subjects
const SUBJECT_PALETTES: Record<string, SubjectTheme> = {
  // Matemáticas / Álgebra / Cálculo -> Blue / Cyan
  matematicas: {
    primary: "text-blue-600",
    primaryHex: "#2563eb",
    bgGradient: "from-blue-600 via-indigo-700 to-slate-900",
    badgeBg: "bg-blue-600",
    badgeText: "text-white",
    pillBg: "bg-blue-50",
    pillText: "text-blue-700",
    pillBorder: "border-blue-200",
    pillHoverBg: "hover:bg-blue-600 hover:text-white hover:border-blue-600",
    accentBorder: "border-blue-500",
    lightBg: "bg-blue-50/70",
    btnBg: "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20",
    statText: "text-blue-600"
  },
  // CRP (Creación, Recreación y Producción) -> Amber / Orange / Warm
  crp: {
    primary: "text-amber-600",
    primaryHex: "#d97706",
    bgGradient: "from-amber-600 via-orange-700 to-slate-900",
    badgeBg: "bg-amber-600",
    badgeText: "text-white",
    pillBg: "bg-amber-50",
    pillText: "text-amber-800",
    pillBorder: "border-amber-200",
    pillHoverBg: "hover:bg-amber-600 hover:text-white hover:border-amber-600",
    accentBorder: "border-amber-500",
    lightBg: "bg-amber-50/70",
    btnBg: "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20",
    statText: "text-amber-600"
  },
  // Castellano / Literatura -> Rose / Red
  castellano: {
    primary: "text-rose-600",
    primaryHex: "#e11d48",
    bgGradient: "from-rose-600 via-pink-700 to-slate-900",
    badgeBg: "bg-rose-600",
    badgeText: "text-white",
    pillBg: "bg-rose-50",
    pillText: "text-rose-700",
    pillBorder: "border-rose-200",
    pillHoverBg: "hover:bg-rose-600 hover:text-white hover:border-rose-600",
    accentBorder: "border-rose-500",
    lightBg: "bg-rose-50/70",
    btnBg: "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20",
    statText: "text-rose-600"
  },
  // Ciencias Naturales / Biología -> Emerald / Green
  ciencias: {
    primary: "text-emerald-600",
    primaryHex: "#059669",
    bgGradient: "from-emerald-600 via-teal-700 to-slate-900",
    badgeBg: "bg-emerald-600",
    badgeText: "text-white",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
    pillBorder: "border-emerald-200",
    pillHoverBg: "hover:bg-emerald-600 hover:text-white hover:border-emerald-600",
    accentBorder: "border-emerald-500",
    lightBg: "bg-emerald-50/70",
    btnBg: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20",
    statText: "text-emerald-600"
  },
  // Física / Química -> Violet / Purple
  fisica: {
    primary: "text-purple-600",
    primaryHex: "#9333ea",
    bgGradient: "from-purple-600 via-violet-800 to-slate-900",
    badgeBg: "bg-purple-600",
    badgeText: "text-white",
    pillBg: "bg-purple-50",
    pillText: "text-purple-700",
    pillBorder: "border-purple-200",
    pillHoverBg: "hover:bg-purple-600 hover:text-white hover:border-purple-600",
    accentBorder: "border-purple-500",
    lightBg: "bg-purple-50/70",
    btnBg: "bg-purple-600 hover:bg-purple-700 shadow-purple-500/20",
    statText: "text-purple-600"
  },
  // Inglés / Idiomas -> Cyan / Sky
  ingles: {
    primary: "text-cyan-600",
    primaryHex: "#0891b2",
    bgGradient: "from-cyan-600 via-teal-800 to-slate-900",
    badgeBg: "bg-cyan-600",
    badgeText: "text-white",
    pillBg: "bg-cyan-50",
    pillText: "text-cyan-800",
    pillBorder: "border-cyan-200",
    pillHoverBg: "hover:bg-cyan-600 hover:text-white hover:border-cyan-600",
    accentBorder: "border-cyan-500",
    lightBg: "bg-cyan-50/70",
    btnBg: "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-500/20",
    statText: "text-cyan-600"
  },
  // Historia / Geografía / GHC -> Bronze / Orange / Yellow
  historia: {
    primary: "text-orange-600",
    primaryHex: "#ea580c",
    bgGradient: "from-orange-600 via-amber-800 to-slate-900",
    badgeBg: "bg-orange-600",
    badgeText: "text-white",
    pillBg: "bg-orange-50",
    pillText: "text-orange-800",
    pillBorder: "border-orange-200",
    pillHoverBg: "hover:bg-orange-600 hover:text-white hover:border-orange-600",
    accentBorder: "border-orange-500",
    lightBg: "bg-orange-50/70",
    btnBg: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/20",
    statText: "text-orange-600"
  },
  // Educación Física -> Lime / Emerald
  educacionfisica: {
    primary: "text-teal-600",
    primaryHex: "#0d9488",
    bgGradient: "from-teal-600 via-emerald-800 to-slate-900",
    badgeBg: "bg-teal-600",
    badgeText: "text-white",
    pillBg: "bg-teal-50",
    pillText: "text-teal-800",
    pillBorder: "border-teal-200",
    pillHoverBg: "hover:bg-teal-600 hover:text-white hover:border-teal-600",
    accentBorder: "border-teal-500",
    lightBg: "bg-teal-50/70",
    btnBg: "bg-teal-600 hover:bg-teal-700 shadow-teal-500/20",
    statText: "text-teal-600"
  }
};

// Array of rich themes for hashing when subject name doesn't match predefined keys
const DYNAMIC_THEMES: SubjectTheme[] = [
  SUBJECT_PALETTES.matematicas,
  SUBJECT_PALETTES.crp,
  SUBJECT_PALETTES.ciencias,
  SUBJECT_PALETTES.fisica,
  SUBJECT_PALETTES.castellano,
  SUBJECT_PALETTES.ingles,
  SUBJECT_PALETTES.historia,
  SUBJECT_PALETTES.educacionfisica,
  {
    primary: "text-fuchsia-600",
    primaryHex: "#c026d3",
    bgGradient: "from-fuchsia-600 via-purple-700 to-slate-900",
    badgeBg: "bg-fuchsia-600",
    badgeText: "text-white",
    pillBg: "bg-fuchsia-50",
    pillText: "text-fuchsia-700",
    pillBorder: "border-fuchsia-200",
    pillHoverBg: "hover:bg-fuchsia-600 hover:text-white hover:border-fuchsia-600",
    accentBorder: "border-fuchsia-500",
    lightBg: "bg-fuchsia-50/70",
    btnBg: "bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-500/20",
    statText: "text-fuchsia-600"
  },
  {
    primary: "text-indigo-600",
    primaryHex: "#4f46e5",
    bgGradient: "from-indigo-600 via-blue-800 to-slate-900",
    badgeBg: "bg-indigo-600",
    badgeText: "text-white",
    pillBg: "bg-indigo-50",
    pillText: "text-indigo-700",
    pillBorder: "border-indigo-200",
    pillHoverBg: "hover:bg-indigo-600 hover:text-white hover:border-indigo-600",
    accentBorder: "border-indigo-500",
    lightBg: "bg-indigo-50/70",
    btnBg: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20",
    statText: "text-indigo-600"
  }
];

export function getSubjectTheme(subjectName: string = ""): SubjectTheme {
  const norm = subjectName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (norm.includes("matematica") || norm.includes("calculo") || norm.includes("algebra")) {
    return SUBJECT_PALETTES.matematicas;
  }
  if (norm.includes("crp") || norm.includes("creacion") || norm.includes("recreacion")) {
    return SUBJECT_PALETTES.crp;
  }
  if (norm.includes("castellano") || norm.includes("lengua") || norm.includes("literatura")) {
    return SUBJECT_PALETTES.castellano;
  }
  if (norm.includes("biologia") || norm.includes("ciencia") || norm.includes("natural")) {
    return SUBJECT_PALETTES.ciencias;
  }
  if (norm.includes("fisica") || norm.includes("quimica")) {
    return SUBJECT_PALETTES.fisica;
  }
  if (norm.includes("ingles") || norm.includes("idioma") || norm.includes("frances")) {
    return SUBJECT_PALETTES.ingles;
  }
  if (norm.includes("historia") || norm.includes("geografia") || norm.includes("ghc") || norm.includes("social")) {
    return SUBJECT_PALETTES.historia;
  }
  if (norm.includes("deporte") || norm.includes("educacion fisica") || norm.includes("gimnasia")) {
    return SUBJECT_PALETTES.educacionfisica;
  }

  // Consistent hash for any other custom subject name
  let hash = 0;
  for (let i = 0; i < norm.length; i++) {
    hash = (hash << 5) - hash + norm.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DYNAMIC_THEMES.length;
  return DYNAMIC_THEMES[index];
}
