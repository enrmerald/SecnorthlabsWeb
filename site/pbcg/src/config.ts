/**
 * Parametros del modelo economico del Plan Base de Ciberseguridad Gestionada.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ESTE FICHERO SI VIVE EN EL REPOSITORIO DEL SITIO, Y ESO ES UN COSTE ASUMIDO.
 *
 * La cabecera anterior decia lo contrario -«vive en el repositorio del gateway y
 * no existe en el del sitio»-, y se quedo escrita cuando el gateway se cancelo y
 * el motor se movio aqui (ISNLA-DOC-0008-MIG-02). Importa corregirlo: es el
 * fichero que concentra las tarifas, y un comentario que promete una separacion
 * que ya no existe invita a confiar en una defensa que no esta.
 *
 * Lo que SI sigue en pie, y es lo que cierra el bloqueante B01:
 *
 *   - Estas cifras **no llegan al navegador**. Solo las lee el motor, que se
 *     ejecuta dentro de una Netlify Function, y el codigo de una funcion no se
 *     descarga. `verify:architecture` prohibe que cualquier fichero de `src/`
 *     importe de `pbcg/`, que es lo que lo garantiza en cada build.
 *   - `verify:export` comprueba ademas que ninguna de estas cadenas aparezca en
 *     `out/`, por si alguna se colara por otro camino.
 *
 * Lo que se pierde respecto al diseno original: el modelo vive en el repositorio
 * que Netlify clona, de modo que quien tenga acceso al repositorio tiene acceso a
 * las tarifas. Es la variante hibrida de MIG-02 §0.4, aprobada por Direccion el
 * 28/07/2026 y documentada en ISNLA-DOC-0008-REQ-01 §0.1.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Espejo literal de la hoja `PARAMETROS` del dimensionador
 * (ISNLA-DOC-0001-01-Dimensionador_PBCG_1.xlsx, v2 julio 2026) y de los dos
 * bloques editables de `AUDITORIAS`. Cada valor lleva anotada su celda de
 * origen para que quien actualice tarifas sepa exactamente que tocar.
 *
 * **No se copian aqui** el coste interno tecnico (`PARAMETROS!B7`), el coste
 * interno de auditoria (`B8`), la tarifa efectiva (`CALCULADORA!E29`) ni el
 * margen bruto (`E30`): no hacen falta para calcular el PVP que ve el cliente,
 * y lo que no esta no se puede filtrar.
 */

export type Size = 'S' | 'M' | 'L'

export const PBCG = {
  // ── PARAMETROS · tarifas y precio ──
  tarifaTecnica: 57, // B5  €/h PVP
  tarifaAuditoria: 65, // B6  €/h PVP, perfil auditor/ofensivo
  redondeo: 5, // B9  el PVP final se redondea a este multiplo
  horquillaAbajo: 0.05, // B10 solo sobre el servicio gestionado
  horquillaArriba: 0.15, // B11

  // ── PARAMETROS · coeficientes de horas tecnicas (h/mes) ──
  coef: {
    edrBase: 1, // B14 gestion de consola y politicas
    edrUsuario: 0.05, // B15 revision semanal de alertas
    backupBase: 1, // B16 supervision semanal de jobs
    backupServidor: 0.25, // B17 incluye prorrateo de la restauracion semestral
    firewallPorEquipo: 1, // B18 revision de alertas, logs y reglas
    siemBase: 4, // B19 revision semanal de eventos
    siemUsuario: 0.02, // B20
    parcheoServidor: 0.4, // B21 ventanas de despliegue y verificacion
    parcheoUsuario: 0.03, // B22 puestos de trabajo
    otPorInstalacion: 2, // B23 supervision pasiva de entorno OT
    cpdPropioOHibrido: 1, // B24 revisiones adicionales de infraestructura propia
    sedeAdicional: 0.5, // B25 coordinacion y elementos de red por sede
    servidorFisico: 0.1, // B26 vigilancia de hardware y firmware
  },

  // ── PARAMETROS · licencias (€/usuario/mes) ──
  // TODO(negocio): MARCADORES DE POSICION, asi anotados en el propio Excel.
  // Confirmar con el distribuidor antes de usarlos en ofertas reales
  // (pendiente P1). Afectan directamente al precio que ve el cliente.
  licencias: {
    edrDefender: 3, // B29
    mdrHuntress: 6.58, // B30
  },

  // ── PARAMETROS · umbrales de tamano ──
  umbrales: { usuariosS: 25, usuariosM: 75, sedesS: 1, sedesM: 3 }, // B33..B36

  // ── AUDITORIAS · horas por ejecucion y tamano (bloque editable, filas 6-11) ──
  //
  // Claves explicitas S/M/L, NO arrays posicionales. Un `[8, 12, 20]` con la
  // nota «mismo orden que arriba» se puede reordenar sin que nada falle, y el
  // error seria invisible: los numeros siguen siendo numeros. Con claves
  // nombradas, ese fallo es un error de compilacion.
  auditoriaHoras: {
    vulnerabilidades: { S: 8, M: 12, L: 20 },
    pentest: { S: 24, M: 40, L: 64 },
    hardening: { S: 12, M: 16, L: 24 },
    firewallArquitectura: { S: 6, M: 8, L: 12 },
    identidades: { S: 8, M: 10, L: 14 },
    retest: { S: 4, M: 6, L: 8 },
  },

  // ── AUDITORIAS · ejecuciones/ano por variante (bloque editable, filas 15-20) ──
  //
  // Se calculan las horas a partir de los dos bloques editables, como hace el
  // Excel con SUMPRODUCT, en lugar de copiar los totales ya prorrateados: si
  // direccion cambia una periodicidad, se toca un numero y todo cuadra.
  auditoriaEjecuciones: {
    nis2: {
      vulnerabilidades: 2,
      pentest: 1,
      hardening: 0,
      firewallArquitectura: 1,
      identidades: 0,
      retest: 1,
    }, // 50 / 78 / 124 h ano
    ensMedia: {
      vulnerabilidades: 2,
      pentest: 1,
      hardening: 1,
      firewallArquitectura: 1,
      identidades: 0,
      retest: 1,
    }, // 62 / 94 / 148 h ano
    ensAlta: {
      vulnerabilidades: 4,
      pentest: 1,
      hardening: 1,
      firewallArquitectura: 1,
      identidades: 1,
      retest: 2,
    }, // 90 / 134 / 210 h ano
  },
} as const

/** Tipado que impide olvidar un tamano o inventarse una prueba. */
export type Prueba = keyof typeof PBCG.auditoriaHoras
export type Modulo = keyof typeof PBCG.auditoriaEjecuciones

const _horas: Record<Prueba, Record<Size, number>> = PBCG.auditoriaHoras
const _ejecuciones: Record<Modulo, Record<Prueba, number>> = PBCG.auditoriaEjecuciones
void _horas
void _ejecuciones

/**
 * Version del modelo economico.
 *
 * Se sube **a mano** cada vez que cambie una tarifa, un coeficiente o una
 * periodicidad, y se guarda en la `submission`, en el `quote_snapshot`, en el
 * Lead de EspoCRM y en los logs tecnicos.
 *
 * Sin esto, cuando alguien pregunte en octubre por que una oferta de julio
 * decia 815 € no habra forma de saber con que tarifas se calculo. Y como las
 * licencias estan marcadas como pendientes de confirmar (P1), va a pasar.
 */
export const PBCG_MODEL_VERSION = '2026-07-v2'
