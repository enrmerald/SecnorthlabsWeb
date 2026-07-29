'use client'

import type { ReactNode } from 'react'

/**
 * Primitivas de formulario, compartidas por contacto y calculadora.
 *
 * Todas siguen las mismas reglas de la Fase 9, y están aquí en lugar de en cada
 * formulario precisamente para que no se apliquen «casi siempre»:
 *
 * - `<label>` asociado por `htmlFor`, nunca un `<div>` que parece etiqueta.
 * - El error se asocia con `aria-describedby` y el campo se marca con
 *   `aria-invalid`, para que un lector de pantalla lea el motivo al enfocar.
 * - Fuente ≥ 16 px en los `input`: por debajo, iOS hace zoom al enfocar y
 *   descoloca la página.
 * - `autocomplete` e `inputmode` en todos, para que salga el teclado correcto y
 *   funcione el autorrelleno del sistema.
 */

const CLASE_BASE = [
  'bg-bg border rounded-[10px] px-4 py-2.5 min-h-11 w-full',
  'text-text placeholder:text-text-dim/70',
  'outline-none transition-colors',
].join(' ')

const claseEstado = (error?: string) =>
  error ? 'border-alert focus-visible:border-alert' : 'border-border focus-visible:border-cyan'

interface Comun {
  id: string
  label: string
  error?: string
  requerido?: boolean
  ayuda?: string
  /** Texto que marca los obligatorios, traducido. */
  etiquetaRequerido?: string
}

function Envoltorio({
  id,
  label,
  error,
  requerido,
  ayuda,
  etiquetaRequerido,
  children,
}: Comun & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-display text-xs font-bold">
        {label}
        {requerido && (
          <>
            {' '}
            <span aria-hidden="true" className="text-cyan">
              *
            </span>
            {/* El asterisco es decorativo; la palabra la lee el lector. */}
            <span className="sr-only"> ({etiquetaRequerido})</span>
          </>
        )}
      </label>

      {children}

      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="text-text-dim text-xs">
          {ayuda}
        </p>
      )}

      {/* `role="alert"` para que el error se anuncie al aparecer. */}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-alert text-xs">
          {error}
        </p>
      )}
    </div>
  )
}

const describedBy = (id: string, error?: string, ayuda?: string) =>
  error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined

type TipoTexto = 'text' | 'email' | 'tel' | 'number'

export function CampoTexto({
  tipo = 'text',
  nombre,
  valor,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  inputMode,
  min,
  max,
  ...comun
}: Comun & {
  tipo?: TipoTexto
  nombre: string
  valor: string | number
  onChange: (valor: string) => void
  onBlur?: () => void
  placeholder?: string
  autoComplete?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
  min?: number
  max?: number
}) {
  return (
    <Envoltorio {...comun}>
      <input
        id={comun.id}
        name={nombre}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        max={max}
        aria-invalid={comun.error ? true : undefined}
        aria-describedby={describedBy(comun.id, comun.error, comun.ayuda)}
        className={`${CLASE_BASE} ${claseEstado(comun.error)}`}
      />
    </Envoltorio>
  )
}

export function CampoSelect({
  nombre,
  valor,
  onChange,
  onBlur,
  opciones,
  placeholder,
  ...comun
}: Comun & {
  nombre: string
  valor: string
  onChange: (valor: string) => void
  onBlur?: () => void
  opciones: readonly { valor: string; etiqueta: string }[]
  placeholder?: string
}) {
  return (
    <Envoltorio {...comun}>
      <select
        id={comun.id}
        name={nombre}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={comun.error ? true : undefined}
        aria-describedby={describedBy(comun.id, comun.error, comun.ayuda)}
        className={`${CLASE_BASE} ${claseEstado(comun.error)}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </Envoltorio>
  )
}

export function CampoTextarea({
  nombre,
  valor,
  onChange,
  onBlur,
  placeholder,
  maximo,
  contadorRestante,
  ...comun
}: Comun & {
  nombre: string
  valor: string
  onChange: (valor: string) => void
  onBlur?: () => void
  placeholder?: string
  maximo: number
  /** Plantilla del contador, con `{n}`. */
  contadorRestante?: string
}) {
  return (
    <Envoltorio {...comun}>
      <textarea
        id={comun.id}
        name={nombre}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        rows={5}
        maxLength={maximo}
        aria-invalid={comun.error ? true : undefined}
        aria-describedby={describedBy(comun.id, comun.error, comun.ayuda)}
        className={`${CLASE_BASE} ${claseEstado(comun.error)} resize-y`}
      />
      {contadorRestante && (
        // `aria-live` no: el contador cambia con cada tecla y lo estaria
        // interrumpiendo todo el rato.
        <p className="text-text-dim text-right text-xs">
          {contadorRestante.replace('{n}', String(maximo - valor.length))}
        </p>
      )}
    </Envoltorio>
  )
}

export function CampoCasilla({
  id,
  nombre,
  marcada,
  onChange,
  error,
  children,
}: {
  id: string
  nombre: string
  marcada: boolean
  onChange: (marcada: boolean) => void
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start gap-3">
        <input
          id={id}
          name={nombre}
          type="checkbox"
          checked={marcada}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`accent-green mt-0.5 size-5 shrink-0 rounded ${error ? 'outline outline-alert' : ''}`}
        />
        <label htmlFor={id} className="text-text-dim text-sm">
          {children}
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-alert text-xs">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * Grupo Sí/No con **radios nativos**.
 *
 * No se hace con `<button>` y `role="radiogroup"`. Reimplementar a mano un
 * patrón que el HTML ya resuelve obliga a gestionar flechas, `aria-checked`,
 * `tabindex` y foco, y casi siempre sale peor que el original. El aspecto se
 * consigue con `appearance-none` y `:checked`, sin una línea de JavaScript
 * extra.
 */
export function GrupoSiNo({
  nombre,
  legend,
  valor,
  onChange,
  textoSi,
  textoNo,
}: {
  nombre: string
  legend: string
  valor: boolean
  onChange: (valor: boolean) => void
  textoSi: string
  textoNo: string
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="font-display mb-1.5 text-xs font-bold">{legend}</legend>
      <div className="flex gap-2">
        {[
          { v: true, t: textoSi },
          { v: false, t: textoNo },
        ].map(({ v, t }) => (
          <label
            key={String(v)}
            className={[
              'font-display flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-[10px] border px-4 text-sm transition-colors',
              valor === v
                ? 'border-green bg-green/10 text-green font-bold'
                : 'border-border text-text-dim hover:border-text-dim',
            ].join(' ')}
          >
            <input
              type="radio"
              name={nombre}
              value={String(v)}
              checked={valor === v}
              onChange={() => onChange(v)}
              className="sr-only"
            />
            {t}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

/**
 * Resumen de errores tras un envío fallido.
 *
 * Recibe el foco al aparecer y enlaza a cada campo. Es la diferencia entre poder
 * corregir el formulario y abandonarlo: sin él, quien navega por teclado o con
 * lector de pantalla tiene que recorrer diez campos buscando cuál falló.
 */
export function ResumenErrores({
  titulo,
  errores,
  refEnfocable,
}: {
  titulo: string
  errores: { id: string; label: string; mensaje: string }[]
  refEnfocable: React.RefObject<HTMLDivElement | null>
}) {
  if (errores.length === 0) return null

  return (
    <div
      ref={refEnfocable}
      tabIndex={-1}
      role="alert"
      className="border-alert bg-alert/10 flex flex-col gap-2 rounded-[10px] border p-4 outline-none"
    >
      <p className="font-display text-alert text-sm font-bold">{titulo}</p>
      <ul className="flex flex-col gap-1">
        {errores.map((e) => (
          <li key={e.id}>
            <a href={`#${e.id}`} className="text-alert text-sm underline">
              {e.label}: {e.mensaje}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
