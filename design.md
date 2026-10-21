# ILUMINA — Sistema de Diseño (v2)
> Bitácora del Docente: una interfaz cálida de papel, cuero y sellos para la gestión académica. Formal para escuelas, con un toque lofi/gaming sutil y pensada para adultos.

**Tema:** Warm Academic / Storybook RPG, modo claro  
**Plataformas:** escritorio (barra superior con pestañas) y móvil (barra inferior). Mismo código, un solo punto de corte.

---

## 1. Filosofía

1. **Una página, no dos.** La pantalla es una sola hoja ordenada, no un cuaderno partido en dos columnas. El carácter de libreta viene de las pestañas, las anillas, los bordes cosidos y las esquinas de cuero.
2. **Menos texto, más señal.** Cada vista tiene un título, cifras grandes en medallas y una acción principal. El detalle aparece al entrar a la ficha.
3. **El estado se lee de un vistazo.** Color, símbolo y texto juntos (★ ● ▲). Nunca solo color.
4. **Lo tangible invita a tocar.** Botones tipo pegatina que se hunden al pulsar, sombras planas sin desenfoque, objetivos táctiles de 44 px o más.
5. **Mascota con propósito.** El búho con birrete acompaña los momentos de ayuda (avisos, buscador, guardado). No decora cada pantalla.

---

## 2. Color

### 2.1 Base y texto
| Token | Hex | Uso |
|---|---|---|
| `--p` Parchment | `#FBF6ED` | Fondo general (con grano de papel) |
| Card | `#FFFFFF` | Tarjetas y fichas |
| `--ink` Ink Dark | `#2B2623` | Títulos y texto principal |
| `--mu` Ink Muted | `#6E655F` | Subtítulos, cédulas, etiquetas |
| `--b` Border Soft | `#E5DCD0` | Bordes de 2 px y sombras de tarjeta |

### 2.2 Marca (cuero, latón, verde brújula)
| Token | Hex | Uso |
|---|---|---|
| `--am` Leather Amber | `#D97706` | Botón primario, barra de progreso por defecto |
| Amber sombra | `#B45309` | Sombra del botón primario |
| `--lt` Leather | `#6B4423` | Títulos de sección secundarios, iconos |
| Cuero claro / oscuro | `#7A4B2A` → `#5E3A20` | Barra superior, barra inferior, cabeceras de planilla |
| Cuero borde | `#3E2514` | Línea inferior de la barra, bordes de pestañas |
| Pestaña inactiva | `#8E5E37` (hover `#A06C40`) | Pestañas sobre el cuero |
| Esquinas de cuero | `#9A6A3C` | Triángulos en tarjetas `.co` |
| Teal brújula | `#2F7F6F` / `#1F5A4E` | Icono de pestaña activa, gema, sello del logo |
| Latón / oro | `#E3B866`, `#F4DFA6` | Anillo de medallas, estrella del logo |
| Crema medalla | `#FFF8E6` | Fondo de medallas y chips de peso |

### 2.3 Semáforo de rendimiento (escala 0–20)
| Estado | Rango | Fondo | Texto | Borde | Barra |
|---|---|---|---|---|---|
| ★ Destacado | 16–20 | `#DCFCE7` | `#15803D` | `#86EFAC` | `#22C55E` |
| ● Regular | 10–15,9 | `#FEF9C3` | `#854D0E` | `#FDE047` | `#EAB308` |
| ▲ En riesgo | 0–9,9 | `#FEE2E2` | `#B91C1C` | `#FCA5A5` | `#EF4444` |

El número de la nota usa el color de texto del estado.

### 2.4 Roles
| Rol | Fondo | Texto | Borde |
|---|---|---|---|
| Grupo mixto / electiva | `#EDE9FE` | `#5B21B6` | `#C4B5FD` (barra `#8B5CF6`) |
| Administrador | `#FEF3C7` | `#92400E` | `#FCD34D` |
| Docente titular | `#E0E7FF` | `#3730A3` | `#A5B4FC` |

### 2.5 Sistema
| Uso | Valores |
|---|---|
| Sincronizado | fondo `#DCFCE7`, texto `#15803D`, borde `#86EFAC` |
| Sello de lacre (N.° de lista) | `#B91C1C`, borde `#7F1D1D`, anillo `#FCA5A5` |
| Botón oscuro (Admin) | `#2B2623`, texto `#FBF6ED`, sombra `#000` |
| Foco de teclado | contorno `#2F7F6F` 3 px, desfase 2 px |

> **Contraste:** el blanco sobre `#D97706` no llega a 4,5:1, así que el botón primario lleva texto `--ink`.

---

## 3. Tipografía

| Familia | Uso |
|---|---|
| **Fredoka** (600/700) | Títulos, cifras, nombres de alumno, botones |
| **Inter** (400–700) | Cuerpo, datos, etiquetas, entradas |

| Rol | Familia | Peso | Tamaño | Línea |
|---|---|---|---|---|
| Display (h1) | Fredoka | 700 | 36 px (móvil 26) | 1,1 |
| Título (h2) | Fredoka | 700 | 24 px (móvil 20) | 1,2 |
| Subtítulo de sección | Fredoka | 700 | 20 px | 1,3 |
| Cifra grande `.num` | Fredoka | 700 | 40 px (planilla 60) | 1 |
| Cuerpo | Inter | 500 | 16 px | 1,5 |
| Secundario `.sub` | Inter | 500 | 14 px | 1,5 |
| Badge / etiqueta | Inter | 600 | 12 px | 1,5 |
| Sobretítulo mayúsculas | Inter | 600 | 12–14 px, tracking .06–.08em | — |

Todos los textos en español. Apóstrofos y comillas tipográficas.

---

## 4. Forma, espacio y elevación

- **Unidad base:** 4 px. Gaps habituales: 8, 12, 16, 20, 24, 32.
- **Radios:** tarjetas 16 · botones e inputs 12 · pills 9999 · pestañas `12 12 0 0` · medallas círculo.
- **Contenedor:** ancho máx. 1240 px, relleno 32/40 (móvil 16/14).
- **Bordes:** 2 px `--b` en tarjetas; 3 px en medallas; 4 px (3 px en móvil) en la línea de cuero.
- **Sombra pegatina (plana, sin desenfoque):**
  - Tarjeta: `0 4px 0 #E5DCD0`
  - Botón primario: `0 4px 0 #B45309`; al pulsar `translateY(3px)` y `0 1px 0`
  - Botón secundario: `0 4px 0 #E5DCD0`
- **Movimiento:** solo transformaciones cortas (0,12 s). Se desactiva con `prefers-reduced-motion`.

---

## 5. Texturas y adornos

| Elemento | Cómo se construye |
|---|---|
| Grano de papel | SVG `feTurbulence` (baseFrequency .8) como fondo, opacidad ≈ 8 % |
| Borde cosido `.sti` | `outline: 2px dashed #EADFCB; outline-offset: -8px` |
| Esquinas de cuero `.co` | Dos triángulos 20 px (`#9A6A3C`) arriba-izquierda y abajo-derecha, con `clip-path` |
| Anillas | Puntos claros sobre franja de cuero (en tarjetas de libreta) |
| Placa de latón | Degradado `#F3E2B3 → #E3C57F`, borde 3 px `#7A4B2A`, doble filo interior |
| Pestañas de libreta | Botones `12 12 0 0` pegados a la página; la activa toma el color de la hoja |

---

## 6. Piezas de identidad (vectores SVG)

- **Logo sello de brújula:** círculo de cuero, anillo dorado, disco teal, estrella de ocho puntas crema y banda con "ILUMINA". Se usa a 72 px en escritorio y 48 px en móvil.
- **Búho mascota:** cuerpo marrón, pecho crema con plumas, ojos grandes y birrete negro con borla ocre. Tamaños 40–76 px. Aparece en: aviso de notas pendientes, buscador de grupo mixto, planilla, barras de acciones.
- **Foto polaroid** `.pol`: marco blanco con borde suave, giro de −3°, avatar vectorial neutro (se sustituye por foto real).
- **Sello de lacre:** círculo rojo con borde punteado y N.° de lista en Fredoka. Va en cada ficha.
- **Medalla** `.med`: círculo crema de 104 px (92 en móvil), doble anillo dorado, cifra en Fredoka y etiqueta en mayúsculas.
- **Barra con gema** `.gb`: pista crema con borde, relleno del color de estado y una gema teal rotada 45° en la posición del porcentaje.
- **Iconos de línea:** trazo 1,9 px, extremos redondeados, 20–24 px. Sin emojis.

---

## 7. Componentes

### 7.1 Navegación
- **Escritorio:** barra de cuero (88 px) con logo, pestañas **Inicio · Clases · Perfil · Admin**, píldora "Sincronizado en la nube" y nombre del docente con su foto. La pestaña activa se funde con la hoja y su icono se tiñe de teal.
- **Móvil (≤ 760 px):** la barra queda con logo + estado + foto. Las pestañas pasan a una barra inferior pegajosa con cuatro botones de icono y etiqueta (mín. 52 × 68 px).
- **Pestañas de lapso:** Lapso 1 · 2 · 3 sobre la hoja principal. Las inactivas son crema `#EFE3CB`.
- **Botón volver:** chip con flecha y el nombre de la pantalla anterior.

### 7.2 Botones y chips
| Tipo | Estilo |
|---|---|
| Primario | Fondo `#D97706`, texto `--ink`, Fredoka 17 px 700, alto 48 |
| Secundario | Blanco, borde 2 px `--b` |
| Oscuro | `#2B2623`, solo para Panel de administrador |
| Peligro (secundario) | Texto `#B91C1C`, borde y sombra `#FCA5A5` |
| Chip de filtro | Pill de 44 px; activo en `--ink` con texto parchment; sección activa en ámbar |
| Contador `.ct` | Burbuja de 22 px con el número dentro del chip o pestaña |

### 7.3 Tarjeta de materia (Inicio)
Borde cosido + esquinas de cuero. Título, curso/sección, "Carga de notas · Lapso 2" con porcentaje y barra con gema, icono de alumnos y pill "N por registrar" (ocre, rojo si > 2). Grupo mixto: fondo `#FBF9FF`, insignia violeta y barra `#8B5CF6`.

### 7.4 Ficha de alumno (Clases y Grupo mixto)
Foto polaroid, nombre en Fredoka 20, C.I. en muted, sello con N.° de lista, pill de estado, nota `/20` y barra con gema. Botón "Calificar alumno". Sin nota: borde cosido, pill "Sin calificar", "— —" e ingreso rápido (10, 15, 20). En grupo mixto se añade la etiqueta violeta de año y sección y un botón de quitar.

### 7.5 Planilla de evaluación
Cabecera de cuero con título del lapso, banda crema con la foto, nombre, estado, **sello de nota final** (borde doble verde, giro −4°) y botones anterior/siguiente. Criterios agrupados: **Académicos 80 %** y **Éticos 20 %**. Cada fila: nombre, chip "N % de la nota", barra con gema y casilla numérica de 84 × 48 px. Pie con búho, estado "Guardado" y botón "Guardar y siguiente".

### 7.6 Perfil
Foto grande, nombre, área y año escolar, insignias de rol, medallas (alumnos, promedio), progreso del lapso. Configuración en tarjetas de 76 px con icono en cuadro crema, título, descripción y flecha. Acciones: Panel de administrador (oscuro), Registrar nuevo docente / cambiar cuenta, Cerrar sesión.

### 7.7 Panel de administrador
Icono de escudo oscuro, título, botón "Registrar docente", medallas (docentes, admins, alumnos) y pestañas Docentes / Alumnos. Lista de filas con foto, nombre, área, rol, alumnos, y botones editar y eliminar (con `aria-label`).

### 7.8 Grupo mixto
Panel violeta "Añadir alumnos al grupo" con búho, buscador por nombre o cédula, resultados con año/sección y botón "Añadir a nómina" (o "En la nómina"). Nómina con filtros por año y tarjeta de adición al final.

### 7.9 Estado de sincronización
Píldora verde "Sincronizado en la nube" con nube y check. En móvil queda solo el icono. Estados por diseñar: *Guardando…* (ámbar) y *Sin conexión*.

---

## 8. Responsive

| Ancho | Cambios |
|---|---|
| ≥ 761 px | Barra superior con pestañas, cuadrículas `auto-fill` (270–340 px), filas de criterios en 4 columnas |
| ≤ 760 px | Barra inferior, una columna, botones y buscadores a ancho completo, relleno de tarjeta 18 px, filas de criterios apiladas (nombre + casilla arriba, chip debajo, barra al final), medallas de 92 px, se oculta el texto de apoyo no esencial (`.hide-m`) |

---

## 9. Accesibilidad

- Objetivos táctiles de 44 px o más; casillas de nota de 48 px.
- Foco visible con contorno teal en botones e inputs.
- El estado nunca depende solo del color: símbolo + texto + color.
- Iconos decorativos con `aria-hidden`; botones de solo icono con `aria-label`.
- Pestaña actual marcada con `aria-current="page"`.
- Contraste revisado en textos de estado; botón primario con texto oscuro.
- Respeta `prefers-reduced-motion`.

---

## 10. Tokens (CSS)

```css
:root {
  --p: #FBF6ED;       /* parchment */
  --ink: #2B2623;
  --mu: #6E655F;
  --am: #D97706;      /* leather amber */
  --b: #E5DCD0;       /* border soft */
  --lt: #6B4423;      /* leather */

  --leather-top: #7A4B2A;  --leather-bottom: #5E3A20;  --leather-edge: #3E2514;
  --teal: #2F7F6F;         --teal-dark: #1F5A4E;
  --brass: #E3B866;        --cream: #FFF8E6;

  --ok: #15803D;   --ok-bg: #DCFCE7;   --ok-bd: #86EFAC;   --ok-bar: #22C55E;
  --mid: #854D0E;  --mid-bg: #FEF9C3;  --mid-bd: #FDE047;  --mid-bar: #EAB308;
  --risk: #B91C1C; --risk-bg: #FEE2E2; --risk-bd: #FCA5A5; --risk-bar: #EF4444;
  --vio: #5B21B6;  --vio-bg: #EDE9FE;  --vio-bd: #C4B5FD;  --vio-bar: #8B5CF6;

  --font-display: 'Fredoka', sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;

  --shadow-card: 0 4px 0 var(--b);
  --shadow-btn: 0 4px 0 #B45309;
}
```

---

## 11. Haz y no hagas

**Haz**
- Mantén una acción primaria por pantalla.
- Usa medallas para cifras clave y barras con gema para progreso.
- Reserva el violeta para grupos mixtos y electivas.
- Mantén el búho en momentos de ayuda.

**No hagas**
- No dividas la pantalla en dos páginas de cuaderno.
- No uses emojis ni mascotas infantiles en datos de alumnos.
- No indiques estado solo con color.
- No añadas sombras con desenfoque ni degradados de colores fuera de la paleta.

---

## 12. Pantallas definidas

Inicio · Clases (nómina de sección) · Planilla de evaluación · Perfil · Panel de administrador · Grupo mixto · Base de Datos / Conexión. Todas con versión de escritorio y móvil.
