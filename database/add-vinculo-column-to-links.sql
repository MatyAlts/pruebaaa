-- ============================================
-- Migración: Agregar columna 'vinculo' a la tabla 'links'
-- Fecha: 12-02-2026
-- Descripción: Agrega un campo para almacenar el tipo de vínculo (médico, familiar, otro)
-- ============================================

-- Agregar la columna vinculo a la tabla links
ALTER TABLE links
ADD COLUMN vinculo VARCHAR(50) DEFAULT 'medico' COMMENT 'Tipo de vínculo: medico, familiar, otro' AFTER nombre_medico;

-- Crear índice para mejorar búsquedas por vínculo (opcional)
CREATE INDEX idx_vinculo ON links(vinculo);

-- ============================================
-- Notas de implementación:
-- ============================================
-- 1. vinculo: Valores posibles: 'medico', 'familiar', 'otro'
-- 2. DEFAULT 'medico': Los registros existentes y nuevos sin especificar tendrán 'medico' por defecto
-- 3. Se agrega después de nombre_medico para mantener una estructura lógica
-- 4. El índice ayudará si se necesita filtrar links por tipo de vínculo en el futuro

-- ============================================
-- Verificar la migración:
-- ============================================
-- Ver la estructura de la tabla:
-- DESCRIBE links;

-- Ver links agrupados por vínculo:
-- SELECT vinculo, COUNT(*) as total FROM links GROUP BY vinculo;
