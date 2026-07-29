'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CampoSelect, CampoTexto, GrupoSiNo } from '@/components/forms/campos'
import type { Locale } from '@/config/routes'
import { RUTAS_API, enviar, nuevoSubmissionId, type RespuestaCotizacion } from '@/lib/api/cliente'
import { euros, horquilla } from '@/lib/formato'

/**
 * Calculadora del PBCG (seccion 5.6 del plan, con el flujo revisado el
 * 28/07/2026).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * EL CALCULO NO ESTA AQUI.
 *
 * Este componente recoge parametros, los envia a `/api/quote` y pinta lo que le
 * devuelven. El motor, las tarifas y los coeficientes viven en `pbcg/`, que solo
 * ejecuta la Netlify Function. `verify:architecture` falla el build si algun
 * fichero de `src/` importa de ahi: es lo que impide que el modelo economico
 * acabe en el navegador (bloqueante B01).
 *
 * Ni una cifra del modelo aparece en este fichero, y no debe aparecer nunca.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * El estado guarda los valores **del contrato**, en ingles, porque son los que
 * se envian; las etiquetas se buscan por su clave en espanol en los mensajes.
 * Traducir en el ultimo momento evita el fallo silencioso de enviar un valor que
 * el servidor no reconoce.
 */

export interface TextosCalculadora {
  organizacion: Record<string, { label?: string; help?: string; options?: Record<string, string> }> & {
    legend: string
  }
  servicios: Record<string, { label?: string; options?: Record<string, string> }> & { legend: string }
  cumplimiento: { legend: string; modulo: { label: string; options: Record<string, string> } }
  si: string
  no: string
  steps: { params: string; contact: string; result: string }
  gate: { title: string; subtitle: string; submit: string; submitting: string }
  contactFields: Record<string, string>
  result: {
    title: string
    perMonth: string
    taxesNote: string
    sizeLabel: string
    breakdown: { title: string; managed: string; licences: string; audits: string; total: string }
    emailSent: string
    referenceLabel: string
    restart: string
    testMode: { title: string; text: string }
  }
  legalNote: string
  auditNote: string
  exclusionsLabel: string
  exclusions: readonly string[]
  errors: Record<string, string>
}

interface Props {
  textos: TextosCalculadora
  locale: Locale
  privacyHref: string
  privacyVersion: string
  marketingVersion: string
  consentLabel: string
  privacyLinkLabel: string
  a11yRequerido: string
}

/** Parametros, con los valores del contrato. */
interface Parametros {
  sites: number
  users: number
  cpd: 'external' | 'own' | 'hybrid'
  physicalServersOwn: number
  virtualServersOwn: number
  physicalServersExternal: number
  virtualServersExternal: number
  otInstallations: number
  edr: 'none' | 'edr' | 'mdr'
  licensesIncluded: boolean
  backup: boolean
  firewalls: number
  siem: boolean
  patching: boolean
  consultingHours: 0 | 2 | 4 | 6
  module: 'none' | 'nis2' | 'ensMedium' | 'ensHigh'
}

const INICIAL: Parametros = {
  sites: 1,
  users: 25,
  cpd: 'external',
  physicalServersOwn: 0,
  virtualServersOwn: 0,
  physicalServersExternal: 0,
  virtualServersExternal: 0,
  otInstallations: 0,
  edr: 'edr',
  licensesIncluded: true,
  backup: true,
  firewalls: 1,
  siem: false,
  patching: false,
  consultingHours: 2,
  module: 'none',
}

/** Claves de mensajes de los enums: en espanol, aunque el valor sea en ingles. */
const CLAVE_CPD = { external: 'externo', own: 'propio', hybrid: 'hibrido' } as const
const CLAVE_EDR = { none: 'ninguno', edr: 'edr', mdr: 'mdr' } as const
const CLAVE_MODULO = {
  none: 'ninguno',
  nis2: 'nis2',
  ensMedium: 'ensMedia',
  ensHigh: 'ensAlta',
} as const

const LIMITES: Record<string, [number, number]> = {
  sites: [1, 50],
  users: [1, 2000],
  physicalServersOwn: [0, 200],
  virtualServersOwn: [0, 500],
  physicalServersExternal: [0, 200],
  virtualServersExternal: [0, 500],
  otInstallations: [0, 20],
  firewalls: [0, 50],
}

export function CalculadoraCliente({
  textos,
  locale,
  privacyHref,
  privacyVersion,
  marketingVersion,
  consentLabel,
  privacyLinkLabel,
  a11yRequerido,
}: Props) {
  const base = useId()
  const idDe = (campo: string) => `${base}-${campo}`

  const [p, setP] = useState<Parametros>(INICIAL)
  const [contacto, setContacto] = useState({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
  })
  const [privacidad, setPrivacidad] = useState(false)
  const [estado, setEstado] = useState<'editando' | 'enviando' | 'listo'>('editando')
  const [resultado, setResultado] = useState<RespuestaCotizacion | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const renderizadoEn = useRef(0)
  const submissionId = useRef('')
  const panelResultado = useRef<HTMLDivElement>(null)

  // Tras el montaje, nunca en el cuerpo: con exportacion estatica un Date.now()
  // en el render se congela con la fecha del build y el antispam queda inutil.
  useEffect(() => {
    renderizadoEn.current = Date.now()
    submissionId.current = nuevoSubmissionId()
  }, [])

  const msg = (clave: string): string => textos.errors[clave] ?? textos.errors.generic ?? ''

  /**
   * Coherencia CPD ↔ servidores. **Error bloqueante, no aviso** (B06).
   *
   * Los campos de servidores se ocultan segun el CPD, pero **sus valores siguen
   * en el estado**, que es justo el caso que dispara esto: quien rellena los
   * cuatro en «Hibrido» y cambia a «Propio» tiene servidores externos puestos
   * aunque no los vea. Ponerlos a cero en silencio produciria un precio mas
   * barato que el real.
   */
  const errorCoherencia = useMemo(() => {
    const externos = p.physicalServersExternal + p.virtualServersExternal
    const propios = p.physicalServersOwn + p.virtualServersOwn
    if (p.cpd === 'own' && externos > 0) return msg('cpdPropioConServidoresExternos')
    if (p.cpd === 'external' && propios > 0) return msg('cpdExternoConServidoresPropios')
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, textos.errors])

  const numeroValido = (campo: keyof Parametros, valor: number) => {
    const limite = LIMITES[campo]
    if (!limite) return true
    return Number.isInteger(valor) && valor >= limite[0] && valor <= limite[1]
  }

  const erroresNumericos = useMemo(() => {
    const salida: Record<string, string> = {}
    for (const campo of Object.keys(LIMITES) as (keyof Parametros)[]) {
      const valor = p[campo] as number
      if (!Number.isInteger(valor)) salida[campo] = msg('entero')
      else if (!numeroValido(campo, valor)) salida[campo] = msg('rango')
    }
    return salida
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p, textos.errors])

  const contactoCompleto =
    contacto.firstName.trim().length >= 2 &&
    contacto.lastName.trim().length >= 2 &&
    contacto.company.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contacto.email.trim())

  const bloqueado =
    errorCoherencia !== null || Object.keys(erroresNumericos).length > 0

  const puedeEnviar = !bloqueado && contactoCompleto && privacidad && estado !== 'enviando'

  const numero = (campo: keyof Parametros) => (valor: string) => {
    // Cadena vacia -> 0, para que borrar el campo no deje `NaN` en el estado.
    const n = valor === '' ? 0 : Number(valor)
    setP((actual) => ({ ...actual, [campo]: Number.isFinite(n) ? n : 0 }))
  }

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!puedeEnviar) return

    setEstado('enviando')
    setErrorGeneral(null)

    const respuesta = await enviar<RespuestaCotizacion>(RUTAS_API.cotizacion, {
      schemaVersion: '1.0',
      submissionId: submissionId.current,
      type: 'quote_request',
      locale,
      createdAt: new Date().toISOString(),
      privacy: { acknowledged: true, noticeVersion: privacyVersion },
      marketing: { optIn: false, textVersion: marketingVersion },
      contact: {
        firstName: contacto.firstName.trim(),
        lastName: contacto.lastName.trim(),
        company: contacto.company.trim(),
        email: contacto.email.trim(),
        phone: contacto.phone.trim(),
      },
      // Se envian los parametros, nunca un total ni una horquilla: el servidor
      // recalcula siempre, y su esquema rechaza cualquier clave que no espere.
      data: p,
      antispam: { honeypot: '', renderedAt: renderizadoEn.current },
    })

    if (respuesta.ok && respuesta.datos.quote) {
      setResultado(respuesta.datos)
      setEstado('listo')
      return
    }

    setEstado('editando')
    setErrorGeneral(respuesta.ok ? msg('generic') : msg(respuesta.error))
  }

  // Al llegar el resultado, el foco va al panel: quien navega por teclado no
  // tiene por que adivinar que ha aparecido algo mas abajo.
  useEffect(() => {
    if (estado === 'listo') panelResultado.current?.focus()
  }, [estado])

  // ── Resultado ──────────────────────────────────────────────────────────────
  if (estado === 'listo' && resultado?.quote) {
    const q = resultado.quote
    return (
      <div
        ref={panelResultado}
        tabIndex={-1}
        // `polite` y solo aqui: anunciar cada recalculo mientras se escribe
        // interrumpiria sin parar a un lector de pantalla.
        aria-live="polite"
        className="flex flex-col gap-6 outline-none"
      >
        <Card destacada acentoColor="verde" acento="top" className="p-6 sm:p-8">
          <h2 className="subtitle">{textos.result.title}</h2>

          <p className="heading-display text-green mt-4">{horquilla(q.totalRangeCents, locale)}</p>
          <p className="font-display text-text-dim mt-1 text-sm">
            {textos.result.perMonth} · {textos.result.taxesNote}
          </p>

          <p className="text-text-dim mt-6 text-sm">
            {textos.result.sizeLabel}: <span className="font-display text-cyan font-bold">{q.size}</span>
          </p>

          <div className="border-border mt-6 border-t pt-5">
            <h3 className="etiqueta text-text-dim mb-3">{textos.result.breakdown.title}</h3>
            <dl className="flex flex-col gap-2 text-sm">
              <Fila etiqueta={textos.result.breakdown.managed} valor={horquilla(q.managedRangeCents, locale)} />
              <Fila etiqueta={textos.result.breakdown.licences} valor={euros(q.licenceCents, locale)} />
              <Fila etiqueta={textos.result.breakdown.audits} valor={euros(q.auditCents, locale)} />
              <div className="border-border mt-2 border-t pt-2">
                <Fila
                  etiqueta={textos.result.breakdown.total}
                  valor={horquilla(q.totalRangeCents, locale)}
                  destacada
                />
              </div>
            </dl>
          </div>

          <p className="text-text-dim mt-6 text-xs">
            <span className="font-display">
              {textos.result.referenceLabel}: {resultado.reference}
            </span>
          </p>
        </Card>

        {/* Modo de pruebas: obligatorio mostrarlo. Un precio en pantalla sin
            decir que no se ha registrado nada hace que alguien de por hecho que
            hay un lead esperando en el CRM. */}
        {resultado.delivery === 'skipped' ? (
          <Card className="border-alert/40 border-dashed p-5">
            <p className="font-display text-alert text-xs font-bold">{textos.result.testMode.title}</p>
            <p className="texto-cuerpo mt-2 text-sm">{textos.result.testMode.text}</p>
          </Card>
        ) : (
          <p className="texto-cuerpo text-sm">
            {textos.result.emailSent.replace('{email}', contacto.email.trim())}
          </p>
        )}

        <NotasLegales textos={textos} />

        <Button
          variante="ghost"
          onClick={() => {
            setEstado('editando')
            setResultado(null)
          }}
        >
          {textos.result.restart}
        </Button>
      </div>
    )
  }

  // ── Formulario ─────────────────────────────────────────────────────────────
  const o = textos.organizacion
  const s = textos.servicios

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-8" noValidate>
      {/* ── Tu organizacion ── */}
      <fieldset className="flex flex-col gap-5">
        <legend className="subtitle mb-2">{o.legend}</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            id={idDe('sites')}
            nombre="sites"
            tipo="number"
            inputMode="numeric"
            label={o.sedes?.label ?? ''}
            ayuda={o.sedes?.help}
            error={erroresNumericos.sites}
            valor={p.sites}
            onChange={numero('sites')}
            min={1}
            max={50}
          />
          <CampoTexto
            id={idDe('users')}
            nombre="users"
            tipo="number"
            inputMode="numeric"
            label={o.usuarios?.label ?? ''}
            ayuda={o.usuarios?.help}
            error={erroresNumericos.users}
            valor={p.users}
            onChange={numero('users')}
            min={1}
            max={2000}
          />
        </div>

        <CampoSelect
          id={idDe('cpd')}
          nombre="cpd"
          label={o.cpd?.label ?? ''}
          valor={p.cpd}
          onChange={(v) => setP((a) => ({ ...a, cpd: v as Parametros['cpd'] }))}
          opciones={(['external', 'own', 'hybrid'] as const).map((v) => ({
            valor: v,
            etiqueta: o.cpd?.options?.[CLAVE_CPD[v]] ?? v,
          }))}
        />

        {/* Los campos de servidores se muestran segun el CPD, pero sus valores
            NO se borran al ocultarse: es lo que permite detectar la incoherencia
            en lugar de tapar el problema. */}
        <div className="grid gap-5 sm:grid-cols-2">
          {(p.cpd === 'own' || p.cpd === 'hybrid') && (
            <>
              <CampoTexto
                id={idDe('physicalServersOwn')}
                nombre="physicalServersOwn"
                tipo="number"
                inputMode="numeric"
                label={o.srvFisPropio?.label ?? ''}
                error={erroresNumericos.physicalServersOwn}
                valor={p.physicalServersOwn}
                onChange={numero('physicalServersOwn')}
                min={0}
              />
              <CampoTexto
                id={idDe('virtualServersOwn')}
                nombre="virtualServersOwn"
                tipo="number"
                inputMode="numeric"
                label={o.srvVirPropio?.label ?? ''}
                error={erroresNumericos.virtualServersOwn}
                valor={p.virtualServersOwn}
                onChange={numero('virtualServersOwn')}
                min={0}
              />
            </>
          )}
          {(p.cpd === 'external' || p.cpd === 'hybrid') && (
            <>
              <CampoTexto
                id={idDe('physicalServersExternal')}
                nombre="physicalServersExternal"
                tipo="number"
                inputMode="numeric"
                label={o.srvFisExt?.label ?? ''}
                error={erroresNumericos.physicalServersExternal}
                valor={p.physicalServersExternal}
                onChange={numero('physicalServersExternal')}
                min={0}
              />
              <CampoTexto
                id={idDe('virtualServersExternal')}
                nombre="virtualServersExternal"
                tipo="number"
                inputMode="numeric"
                label={o.srvVirExt?.label ?? ''}
                error={erroresNumericos.virtualServersExternal}
                valor={p.virtualServersExternal}
                onChange={numero('virtualServersExternal')}
                min={0}
              />
            </>
          )}
        </div>

        <CampoTexto
          id={idDe('otInstallations')}
          nombre="otInstallations"
          tipo="number"
          inputMode="numeric"
          label={o.instalacionesOT?.label ?? ''}
          ayuda={o.instalacionesOT?.help}
          error={erroresNumericos.otInstallations}
          valor={p.otInstallations}
          onChange={numero('otInstallations')}
          min={0}
          max={20}
        />

        {errorCoherencia && (
          <p role="alert" className="border-alert bg-alert/10 text-alert rounded-[10px] border p-3 text-sm">
            {errorCoherencia}
          </p>
        )}
      </fieldset>

      {/* ── Servicios gestionados ── */}
      <fieldset className="flex flex-col gap-5">
        <legend className="subtitle mb-2">{s.legend}</legend>

        <CampoSelect
          id={idDe('edr')}
          nombre="edr"
          label={s.edr?.label ?? ''}
          valor={p.edr}
          onChange={(v) => setP((a) => ({ ...a, edr: v as Parametros['edr'] }))}
          opciones={(['none', 'edr', 'mdr'] as const).map((v) => ({
            valor: v,
            etiqueta: s.edr?.options?.[CLAVE_EDR[v]] ?? v,
          }))}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <GrupoSiNo
            nombre="licensesIncluded"
            legend={s.licenciasIncluidas?.label ?? ''}
            valor={p.licensesIncluded}
            onChange={(v) => setP((a) => ({ ...a, licensesIncluded: v }))}
            textoSi={textos.si}
            textoNo={textos.no}
          />
          <GrupoSiNo
            nombre="backup"
            legend={s.backup?.label ?? ''}
            valor={p.backup}
            onChange={(v) => setP((a) => ({ ...a, backup: v }))}
            textoSi={textos.si}
            textoNo={textos.no}
          />
          <GrupoSiNo
            nombre="siem"
            legend={s.siem?.label ?? ''}
            valor={p.siem}
            onChange={(v) => setP((a) => ({ ...a, siem: v }))}
            textoSi={textos.si}
            textoNo={textos.no}
          />
          <GrupoSiNo
            nombre="patching"
            legend={s.parcheo?.label ?? ''}
            valor={p.patching}
            onChange={(v) => setP((a) => ({ ...a, patching: v }))}
            textoSi={textos.si}
            textoNo={textos.no}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <CampoTexto
            id={idDe('firewalls')}
            nombre="firewalls"
            tipo="number"
            inputMode="numeric"
            label={s.firewalls?.label ?? ''}
            error={erroresNumericos.firewalls}
            valor={p.firewalls}
            onChange={numero('firewalls')}
            min={0}
            max={50}
          />
          <CampoSelect
            id={idDe('consultingHours')}
            nombre="consultingHours"
            label={s.horasConsultoria?.label ?? ''}
            valor={String(p.consultingHours)}
            onChange={(v) =>
              setP((a) => ({ ...a, consultingHours: Number(v) as Parametros['consultingHours'] }))
            }
            opciones={[0, 2, 4, 6].map((h) => ({ valor: String(h), etiqueta: String(h) }))}
          />
        </div>
      </fieldset>

      {/* ── Cumplimiento normativo ── */}
      <fieldset className="flex flex-col gap-5">
        <legend className="subtitle mb-2">{textos.cumplimiento.legend}</legend>
        <CampoSelect
          id={idDe('module')}
          nombre="module"
          label={textos.cumplimiento.modulo.label}
          valor={p.module}
          onChange={(v) => setP((a) => ({ ...a, module: v as Parametros['module'] }))}
          opciones={(['none', 'nis2', 'ensMedium', 'ensHigh'] as const).map((v) => ({
            valor: v,
            etiqueta: textos.cumplimiento.modulo.options[CLAVE_MODULO[v]] ?? v,
          }))}
        />
      </fieldset>

      {/* ── Datos de contacto ── */}
      <Card className="flex flex-col gap-5 p-6">
        <div>
          <h2 className="subtitle">{textos.gate.title}</h2>
          <p className="texto-cuerpo mt-2 text-sm">{textos.gate.subtitle}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {(['firstName', 'lastName', 'company', 'email', 'phone'] as const).map((campo) => (
            <CampoTexto
              key={campo}
              id={idDe(campo)}
              nombre={campo}
              tipo={campo === 'email' ? 'email' : campo === 'phone' ? 'tel' : 'text'}
              inputMode={campo === 'email' ? 'email' : campo === 'phone' ? 'tel' : undefined}
              autoComplete={
                campo === 'firstName'
                  ? 'given-name'
                  : campo === 'lastName'
                    ? 'family-name'
                    : campo === 'company'
                      ? 'organization'
                      : campo
              }
              label={textos.contactFields[campo] ?? ''}
              requerido={campo !== 'phone'}
              etiquetaRequerido={a11yRequerido}
              valor={contacto[campo]}
              onChange={(v) => setContacto((c) => ({ ...c, [campo]: v }))}
            />
          ))}
        </div>

        <div className="flex items-start gap-3">
          <input
            id={idDe('privacy')}
            type="checkbox"
            checked={privacidad}
            onChange={(e) => setPrivacidad(e.target.checked)}
            className="accent-green mt-0.5 size-5 shrink-0 rounded"
          />
          <label htmlFor={idDe('privacy')} className="text-text-dim text-sm">
            {consentLabel}{' '}
            <a href={privacyHref} className="text-cyan underline">
              {privacyLinkLabel}
            </a>
          </label>
        </div>

        {/* Honeypot, fuera de pantalla y del flujo accesible. */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor={idDe('hp')}>No rellenar</label>
          <input id={idDe('hp')} name="empresa_web" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <Button type="submit" variante="primario" tamano="lg" ancho disabled={!puedeEnviar}>
          {estado === 'enviando' ? textos.gate.submitting : textos.gate.submit}
        </Button>

        {/* Explica POR QUE el boton esta desactivado. Un boton gris sin motivo
            deja a la persona sin saber que corregir. */}
        {bloqueado && (
          <p className="text-text-dim text-xs">{msg('blocked')}</p>
        )}

        {errorGeneral && (
          <p role="alert" className="text-alert text-sm">
            {errorGeneral}
          </p>
        )}
      </Card>

      <NotasLegales textos={textos} />
    </form>
  )
}

function Fila({
  etiqueta,
  valor,
  destacada = false,
}: {
  etiqueta: string
  valor: string
  destacada?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={destacada ? 'font-display text-sm font-bold' : 'text-text-dim'}>{etiqueta}</dt>
      <dd className={`font-display shrink-0 ${destacada ? 'text-green font-bold' : ''}`}>{valor}</dd>
    </div>
  )
}

/** Notas legales del pie de la calculadora. Se conservan del Excel y del prototipo. */
function NotasLegales({ textos }: { textos: TextosCalculadora }) {
  return (
    <div className="border-border text-text-dim flex flex-col gap-3 border-t pt-6 text-xs">
      <p>{textos.legalNote}</p>
      <p>{textos.auditNote}</p>
      <div>
        <p className="etiqueta mb-2">{textos.exclusionsLabel}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {textos.exclusions.map((e) => (
            <li key={e}>· {e}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
