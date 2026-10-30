-- ============================================================================
-- Limpieza de evaluaciones duplicadas + restricción de unicidad
-- ----------------------------------------------------------------------------
-- EJECUTAR MANUALMENTE en Supabase → SQL Editor (es destructivo, hace backup
-- previo en una tabla `_backup_evaluaciones_duplicadas`).
--
-- Problema: la app creaba filas duplicadas de `evaluaciones` para una misma
-- combinación (materia_id, lapso, clave_item) porque no existía restricción
-- de unicidad. Al editar una evaluación, se actualizaba solo una fila y la
-- lectura devolvía otra copia con el título/ponderación antiguos.
--
-- Estrategia:
--   1. Backup de todas las filas duplicadas antes de tocar nada.
--   2. Trasladar las `calificaciones` que apuntan a las filas duplicadas a la
--      fila "canónica" (la primera de cada grupo) fusionando cuando ya exista.
--   3. Borrar las filas duplicadas (las calificaciones migradas se conservan).
--   4. Crear restricción unique + índice para que no vuelva a ocurrir.
-- ============================================================================

-- 1. Backup previo ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public._backup_evaluaciones_duplicadas AS
SELECT *
FROM public.evaluaciones
WHERE id IN (
  SELECT id
  FROM (
    SELECT e.id,
           ROW_NUMBER() OVER (
             PARTITION BY e.materia_id, e.lapso, e.clave_item
             ORDER BY e.created_at ASC NULLS LAST, e.id ASC
           ) AS rn
    FROM public.evaluaciones e
  ) t
  WHERE t.rn > 1
);

-- 2. integrar calificaciones duplicadas hacia la fila canónica ------------------
-- Mover nota de la fila duplicada a la canónica solo si la canónica NO tiene nota
-- para ese alumno (si ya la tiene, la duplicada se descarta más adelante).
WITH duplicadas AS (
  SELECT e.*,
         ROW_NUMBER() OVER (
           PARTITION BY e.materia_id, e.lapso, e.clave_item
           ORDER BY e.created_at ASC NULLS LAST, e.id ASC
         ) AS rn,
         FIRST_VALUE(e.id) OVER (
           PARTITION BY e.materia_id, e.lapso, e.clave_item
           ORDER BY e.created_at ASC NULLS LAST, e.id ASC
         ) AS canonico_id
  FROM public.evaluaciones e
),
duplicadas_reales AS (
  SELECT id, canonico_id FROM duplicadas WHERE rn > 1
),
-- Calificaciones de duplicadas cuyo par (evaluacion_id, alumno_id) NO exista
-- en la canónica: se actualizan para apuntar a la canónica.
calif_a_mover AS (
  SELECT c.id, d.canonico_id
  FROM public.calificaciones c
  JOIN duplicadas_reales d ON d.id = c.evaluacion_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.calificaciones c2
    WHERE c2.evaluacion_id = d.canonico_id
      AND c2.alumno_id = c.alumno_id
  )
)
UPDATE public.calificaciones c
SET evaluacion_id = cim.canonico_id
FROM calif_a_mover cim
WHERE c.id = cim.id;

-- 3. Borrar filas duplicadas ----------------------------------------------------
-- (ON DELETE CASCADE elimina las calificaciones que aún apuntaban a ellas;
--  por eso las movimos en el paso 2).
WITH duplicadas AS (
  SELECT e.id,
         ROW_NUMBER() OVER (
           PARTITION BY e.materia_id, e.lapso, e.clave_item
           ORDER BY e.created_at ASC NULLS LAST, e.id ASC
         ) AS rn
  FROM public.evaluaciones e
)
DELETE FROM public.evaluaciones
WHERE id IN (SELECT id FROM duplicadas WHERE rn > 1);

-- 4. Restricción de unicidad para el futuro ------------------------------------
-- Si falla porque ya no hay duplicados distintos de los borrados, ejecutar de nuevo.
ALTER TABLE public.evaluaciones
  ADD CONSTRAINT evaluaciones_materia_lapso_clave_key
  UNIQUE (materia_id, lapso, clave_item);

CREATE INDEX IF NOT EXISTS idx_evaluaciones_materia_lapso ON public.evaluaciones(materia_id, lapso);

-- Verificación (opcional): debe devolver 0 filas duplicadas
/*
SELECT materia_id, lapso, clave_item, COUNT(*) AS filas
FROM public.evaluaciones
GROUP BY materia_id, lapso, clave_item
HAVING COUNT(*) > 1;
*/
