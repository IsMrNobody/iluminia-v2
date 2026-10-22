import React from "react";

export function IluminaLogo({ size = 72, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label="Ilumina"
      className={className}
    >
      <circle cx="50" cy="50" r="47" fill="#7A4B2A" stroke="#3E2514" strokeWidth="3" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#E3B866" strokeWidth="2" />
      <circle cx="50" cy="50" r="35" fill="#2F7F6F" stroke="#1F5A4E" strokeWidth="2" />
      <polygon
        points="50,14 58,42 86,50 58,58 50,86 42,58 14,50 42,42"
        fill="#F4DFA6"
        stroke="#8A5A22"
        strokeWidth="1.5"
      />
      <rect x="12" y="41" width="76" height="20" rx="4" fill="#F9EBC4" stroke="#3E2514" strokeWidth="2" />
      <text
        x="50"
        y="56"
        textAnchor="middle"
        fontFamily="Fredoka, sans-serif"
        fontWeight="700"
        fontSize="13"
        fill="#3E2514"
        letterSpacing="1"
      >
        ILUMINA
      </text>
    </svg>
  );
}

const FILAS: Record<string, number> = {
  bienvenida: 0,
  ensenando: 1,
  pensativa: 2,
  seria: 3,
  celebracion: 4,
  cansada: 5,
  alerta: 6,
  orgullosa: 7,
  paciente: 8,
  curiosa: 9,
  confundida: 10,
  guino: 11,
  happy: 0,
  reading: 1,
  thinking: 2,
  chart: 3,
  bell: 6,
  medal: 7,
  heart: 8,
  sweat: 10,
  wink: 11,
  right: 1,
  sleeping: 5,
  front: 0,
};

export function IluminaOwl({
  width = 64,
  height = 70,
  className = "",
  pose = "bienvenida",
  col = 0,
  animated = false
}: {
  width?: number;
  height?: number;
  className?: string;
  pose?: string;
  col?: number;
  escala?: number;
  animated?: boolean;
}) {
  const rowIndex = FILAS[pose] !== undefined ? FILAS[pose] : 0;
  const [currentCol, setCurrentCol] = React.useState(col);

  React.useEffect(() => {
    setCurrentCol(col);
  }, [col]);

  React.useEffect(() => {
    if (!animated) return;
    const timer = setInterval(() => {
      setCurrentCol((prev) => (prev + 1) % 4);
    }, 300);
    return () => clearInterval(timer);
  }, [animated, pose]);

  const colIndex = currentCol >= 0 && currentCol <= 3 ? currentCol : 0;

  return (
    <div
      className={`relative inline-block overflow-hidden shrink-0 ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
      role="img"
      aria-label={`Mascota Ilumina - ${pose}`}
    >
      <img
        src="/ilumina-sprites@3x.png"
        alt={`Ilumina ${pose}`}
        className="absolute max-w-none pointer-events-none"
        style={{
          width: `${width * 4}px`,
          height: `${height * 12}px`,
          left: `-${colIndex * width}px`,
          top: `-${rowIndex * height}px`,
          imageRendering: "pixelated" as any,
        }}
      />
    </div>
  );
}

export function PolaroidAvatar({
  avatarUrl,
  alt = "Avatar",
  size = 54,
  className = "",
  rotation = "-3deg"
}: {
  avatarUrl?: string;
  alt?: string;
  size?: number;
  className?: string;
  rotation?: string;
}) {
  const fallbackBg = "#EADBC0";
  return (
    <div
      className={`pol ${className}`}
      style={{ width: `${size}px`, transform: `rotate(${rotation})` }}
      aria-label={alt}
    >
      <div
        className="w-full aspect-square overflow-hidden rounded-xs bg-[#EADBC0] flex items-center justify-center relative"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={alt}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : null}
        {/* Vector SVG avatar fallback */}
        <svg
          viewBox="0 0 60 60"
          width="100%"
          height="100%"
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none -z-10"
        >
          <rect width="60" height="60" fill={fallbackBg} />
          <circle cx="30" cy="26" r="15" fill="#4A2C17" />
          <circle cx="30" cy="29" r="11" fill="#C98F65" />
          <path d="M8 60c0-14 10-18 22-18s22 4 22 18z" fill="#6F9A7C" />
        </svg>
      </div>
    </div>
  );
}

export function GemProgressBar({
  percent = 0,
  barColor = "#D97706",
  className = "",
  onChangeScore
}: {
  percent: number;
  barColor?: string;
  className?: string;
  onChangeScore?: (score: number) => void;
}) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percent)));

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    e.stopPropagation();
    if (!onChangeScore) return;
    const gbEl = e.currentTarget.closest(".gb");
    const gtEl = gbEl?.querySelector(".gt");
    if (!gtEl) return;
    const rect = gtEl.getBoundingClientRect();

    const updateFromEvent = (clientX: number) => {
      const x = clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      const rawScore = ratio * 20;
      const steppedScore = Math.round(rawScore * 2) / 2; // rounds to nearest 0.5
      onChangeScore(steppedScore);
    };

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateFromEvent(moveEvent.clientX);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div
      className={`gb select-none touch-none ${className}`}
      title="Arrastra el punto para ajustar la nota (0 - 20)"
    >
      <div className="gt">
        <i style={{ width: `${safePercent}%`, background: barColor }} />
      </div>
      <b
        className="gm cursor-ew-resize active:scale-110"
        style={{ left: `${safePercent}%` }}
        onPointerDown={handlePointerDown}
      />
    </div>
  );
}

export function WaxSealNumber({
  numberStr,
  size = 40,
  className = ""
}: {
  numberStr: string | number;
  size?: number;
  className?: string;
}) {
  const displayVal = String(numberStr).padStart(2, "0");
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      aria-label={`N.° ${displayVal}`}
      role="img"
      className={`shrink-0 ${className}`}
    >
      <circle cx="20" cy="20" r="18" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="2" strokeDasharray="5 2.5" />
      <circle cx="20" cy="20" r="13.5" fill="none" stroke="#FCA5A5" strokeWidth="1.5" />
      <text
        x="20"
        y="25.5"
        textAnchor="middle"
        fontFamily="Fredoka, sans-serif"
        fontWeight="700"
        fontSize="14"
        fill="#FEE2E2"
      >
        {displayVal}
      </text>
    </svg>
  );
}

const OBJECT_ROWS: Record<string, number> = {
  rubi: 0,
  esmeralda: 1,
  gemadorada: 2,
  libroabierto: 3,
  librocerrado: 4,
  escoba: 5,
  plumablanca: 6,
  plumaazul: 7,
  plumaestilografica: 8,
  lapiz: 9,
  lupa: 10,
  lupaconmano: 11,
  pergamino: 12,
  pocion: 13,
  sistemasolar: 14,
  brujula: 15,
  engranaje: 16,
  telescopio: 17,
  coronadelaurel: 18,
  medalla: 19,
  birrete: 20,
  rosetadorada: 21,
};

export function SpriteObject({
  name = "rubi",
  col = 0,
  size = 64,
  className = ""
}: {
  name: string;
  col?: number;
  size?: number;
  className?: string;
}) {
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, "");
  const rowIndex = OBJECT_ROWS[cleanName] ?? 0;
  const cols = 6;
  const rows = 22;
  const colIndex = Math.max(0, Math.min(cols - 1, col));

  return (
    <div
      className={`inline-block shrink-0 overflow-hidden ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: "url('/sprites-objetos.webp')",
        backgroundSize: `${size * cols}px ${size * rows}px`,
        backgroundPosition: `-${colIndex * size}px -${rowIndex * size}px`,
        imageRendering: "pixelated" as any,
      }}
      role="img"
      aria-label={name}
    />
  );
}

export function MedalCounter({
  value,
  label,
  valueColor,
  gemIcon,
  spriteName,
  spriteCol = 0,
  className = ""
}: {
  value: string | number;
  label: string;
  valueColor?: string;
  gemIcon?: string;
  spriteName?: string;
  spriteCol?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center text-center bg-[#FFF8E6] border-2 border-[#9A6A3C] rounded-xl px-2.5 py-2 shadow-2xs flex-1 sm:flex-none sm:min-w-[84px] ${className}`}>
      {spriteName ? (
        <div className="mb-1.5 mt-0.5 flex items-center justify-center">
          <SpriteObject name={spriteName} col={spriteCol} size={56} />
        </div>
      ) : (
        <img
          src={gemIcon || "/gem-green.png"}
          alt=""
          className="w-7 h-7 object-contain mb-1.5 mt-0.5 drop-shadow-sm"
        />
      )}
      <b className="font-display text-base sm:text-lg font-bold leading-none mb-0.5" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </b>
      <span className="text-[9px] sm:text-[10px] font-semibold text-[#6E655F] uppercase tracking-wider truncate w-full">
        {label}
      </span>
    </div>
  );
}

export function PerformanceBadge({
  score,
  label,
  className = ""
}: {
  score?: number;
  label?: string;
  className?: string;
}) {
  if (score === undefined || score === null) {
    return <span className={`bg mid ${className}`}>Sin calificar</span>;
  }
  if (score >= 16) {
    return <span className={`bg ok ${className}`}>★ {label || "Destacado"}</span>;
  }
  if (score >= 10) {
    return <span className={`bg mid ${className}`}>● {label || "Regular"}</span>;
  }
  return <span className={`bg risk ${className}`}>▲ {label || "En riesgo"}</span>;
}

export function BrujulaLogoAnimated({
  className = ""
}: {
  className?: string;
}) {
  const [frame, setFrame] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  // Animation on mount (entry) - 32 frames (8 cols x 4 rows)
  React.useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      setFrame((prev) => {
        const next = (prev + 1) % 32;
        count++;
        if (count >= 32 && !isHovered) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, 55);
    return () => clearInterval(timer);
  }, []);

  // Animation on hover
  React.useEffect(() => {
    if (!isHovered) return;
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % 32);
    }, 55);
    return () => clearInterval(timer);
  }, [isHovered]);

  const cols = 8;
  const rows = 4;
  const col = frame % cols;
  const row = Math.floor(frame / cols);
  const size = 52;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setFrame(0);
      }}
      className={`relative inline-block shrink-0 cursor-pointer ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: "url('/brujula-sprite.webp')",
        backgroundSize: `${size * cols}px ${size * rows}px`,
        backgroundPosition: `-${col * size}px -${row * size}px`,
      }}
      role="img"
      aria-label="Brújula Ilumina"
    />
  );
}
