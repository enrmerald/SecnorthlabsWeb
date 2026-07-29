'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Locale } from '@/config/routes'
import { RUTAS_API, enviar, esperarMinimoAntispam, nuevoSubmissionId, type RespuestaContacto } from '@/lib/api/cliente'
import {
  CampoCasilla,
  CampoSelect,
  CampoTexto,
  CampoTextarea,
  ResumenErrores,
} from './campos'

/**
 * Formulario de contacto (seccion 6.1 del plan).
 *
 * Recibe **todos** los textos por props desde un componente de build: no monta
 * ningun provider de traduccion ni descarga el arbol de mensajes (seccion 1.4.1).
 *
 * Reglas que se cumplen aqui y que conviene no perder al tocarlo:
 *
 * - **Nombre y apellidos en dos campos.** Partir «María José García Pérez» por
 *   el primer espacio falla con una parte grande de los nombres espanoles.
 * - La casilla obligatoria **acredita que se facilito la informacion** de
 *   proteccion de datos; no es un consentimiento generico. El de marketing va
 *   aparte, opcional y sin premarcar (bloqueante B04).
 * - Validacion al **perder el foco**, y de nuevo al enviar.
 * - Dominio de correo generico: **aviso suave, nunca bloqueo**.
 * - Tras un envio fallido, **resumen de errores que recibe el foco**.
 */

export interface TextosContacto {
  title: string
  fields: Record<string, { label: string; placeholder: string }>
  needOptions: readonly string[]
  consent: string
  marketing: string
  submit: string
  responseNote: string
  successMessage: string
  requiredNote: string
  privacyLinkLabel: string
  privacyNote: string
  privacyBasicInfo: {
    title: string
    rows: readonly { label: string; value: string }[]
    moreLabel: string
  }
  errors: Record<string, string>
}

interface Props {
  textos: TextosContacto
  locale: Locale
  privacyHref: string
  /** Versiones del texto informativo, para poder acreditar qué se mostró. */
  privacyVersion: string
  marketingVersion: string
  a11yRequerido: string
}

type Campos = {
  firstName: string
  lastName: string
  company: string
  email: string
  phone: string
  role: string
  need: string
  message: string
}

const VACIO: Campos = {
  firstName: '',
  lastName: '',
  company: '',
  email: '',
  phone: '',
  role: '',
  need: '',
  message: '',
}

/** Dominios de correo personal. Provocan aviso, no bloqueo. */
const DOMINIOS_GENERICOS = ['gmail.', 'hotmail.', 'outlook.', 'yahoo.', 'live.', 'icloud.']

const MAX_MENSAJE = 1000

export function FormularioContacto({
  textos,
  locale,
  privacyHref,
  privacyVersion,
  marketingVersion,
  a11yRequerido,
}: Props) {
  const base = useId()
  const idDe = (campo: string) => `${base}-${campo}`

  const [campos, setCampos] = useState<Campos>(VACIO)
  const [privacidad, setPrivacidad] = useState(false)
  const [marketing, setMarketing] = useState(false)
  const [errores, setErrores] = useState<Partial<Record<keyof Campos | 'privacy', string>>>({})
  const [aviso, setAviso] = useState<string | null>(null)
  const [estado, setEstado] = useState<'inicial' | 'enviando' | 'exito' | 'error'>('inicial')
  const [resultado, setResultado] = useState<RespuestaContacto | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [mostrarResumen, setMostrarResumen] = useState(false)

  const resumen = useRef<HTMLDivElement>(null)

  // Acceso a los mensajes de error con respaldo. `noUncheckedIndexedAccess`
  // devuelve `string | undefined` al indexar, y esta bien que lo haga: un codigo
  // que el servidor invente no debe dejar la interfaz sin texto. El respaldo es
  // el mensaje genérico.
  const msg = (clave: string): string => textos.errors[clave] ?? textos.errors.generic ?? ''

  // Marca de tiempo y identificador **despues del montaje**. Con exportacion
  // estatica, un Date.now() en el cuerpo del componente se congela con la fecha
  // del build: la comprobacion de tiempo daria siempre por bueno el envio y el
  // antispam seria decorativo. Y el submissionId seria el mismo para todos.
  const renderizadoEn = useRef(0)
  const submissionId = useRef('')
  useEffect(() => {
    renderizadoEn.current = Date.now()
    submissionId.current = nuevoSubmissionId()
  }, [])

  // El resumen recibe el foco al aparecer, no al montar.
  useEffect(() => {
    if (mostrarResumen) resumen.current?.focus()
  }, [mostrarResumen])

  const actualizar = (campo: keyof Campos) => (valor: string) => {
    setCampos((c) => ({ ...c, [campo]: valor }))
    // Al escribir se limpia el error del campo: mantenerlo mientras la persona
    // corrige es ruido.
    if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined }))
  }

  function validarCampo(campo: keyof Campos): string | undefined {
    const v = campos[campo].trim()
    switch (campo) {
      case 'firstName':
        return v.length < 2 || v.length > 40 ? msg('firstName') : undefined
      case 'lastName':
        return v.length < 2 || v.length > 60 ? msg('lastName') : undefined
      case 'company':
        return v.length < 2 || v.length > 80 ? msg('company') : undefined
      case 'email':
        // Validación deliberadamente laxa: la estricta la hace el servidor, y
        // una expresión agresiva rechaza direcciones válidas raras.
        return !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? msg('email') : undefined
      case 'need':
        return v === '' ? msg('need') : undefined
      case 'message':
        return v.length > MAX_MENSAJE ? msg('message') : undefined
      default:
        return undefined
    }
  }

  const alSalirDe = (campo: keyof Campos) => () => {
    setErrores((e) => ({ ...e, [campo]: validarCampo(campo) }))

    if (campo === 'email') {
      const dominio = campos.email.toLowerCase()
      // Aviso suave: quien solo tiene correo personal debe poder enviar.
      setAviso(
        DOMINIOS_GENERICOS.some((d) => dominio.includes(d))
          ? msg('genericEmailDomain')
          : null,
      )
    }
  }

  async function alEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (estado === 'enviando') return

    const nuevos: typeof errores = {}
    for (const campo of Object.keys(campos) as (keyof Campos)[]) {
      const e = validarCampo(campo)
      if (e) nuevos[campo] = e
    }
    if (!privacidad) nuevos.privacy = msg('consent')

    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) {
      setMostrarResumen(true)
      return
    }

    setMostrarResumen(false)
    setEstado('enviando')
    setErrorGeneral(null)

    // Retiene el envio si aun no se ha superado el tiempo minimo del antispam.
    // El boton ya esta en 'enviando', asi que para quien lo usa es simplemente
    // un envio que tarda un instante mas.
    await esperarMinimoAntispam(renderizadoEn.current)

    const respuesta = await enviar<RespuestaContacto>(RUTAS_API.contacto, {
      schemaVersion: '1.0',
      submissionId: submissionId.current,
      type: 'contact',
      locale,
      createdAt: new Date().toISOString(),
      privacy: { acknowledged: true, noticeVersion: privacyVersion },
      marketing: { optIn: marketing, textVersion: marketingVersion },
      contact: {
        firstName: campos.firstName.trim(),
        lastName: campos.lastName.trim(),
        company: campos.company.trim(),
        email: campos.email.trim(),
        phone: campos.phone.trim(),
        title: campos.role.trim(),
      },
      data: { need: campos.need, message: campos.message.trim() },
      antispam: { honeypot: '', renderedAt: renderizadoEn.current },
    })

    if (respuesta.ok) {
      setResultado(respuesta.datos)
      setEstado('exito')
      return
    }

    setEstado('error')
    setErrorGeneral(msg(respuesta.error))
    if (respuesta.campos) {
      // El servidor devuelve códigos por campo; el texto lo pone el cliente.
      const delServidor: typeof errores = {}
      for (const [ruta, codigo] of Object.entries(respuesta.campos)) {
        const campo = ruta.split('.').at(-1) as keyof Campos
        if (campo in campos) delServidor[campo] = msg(codigo)
      }
      setErrores(delServidor)
      setMostrarResumen(true)
    }
  }

  if (estado === 'exito' && resultado) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <p className="font-display text-green text-base font-bold">{textos.successMessage}</p>
        <p className="font-display text-text-dim text-sm">Ref. {resultado.reference}</p>
        {/* Modo de pruebas: no se puede ocultar. Si se dice «lo hemos recibido»
            sin que se haya registrado nada, alguien da por hecho que hay un
            lead esperando en el CRM. */}
        {resultado.delivery === 'skipped' && (
          <p className="border-alert/40 text-text-dim rounded-[10px] border border-dashed p-3 text-xs">
            {msg('testMode')}
          </p>
        )}
      </div>
    )
  }

  const etiquetas: Record<keyof Campos, string> = {
    firstName: textos.fields.firstName?.label ?? '',
    lastName: textos.fields.lastName?.label ?? '',
    company: textos.fields.company?.label ?? '',
    email: textos.fields.email?.label ?? '',
    phone: textos.fields.phone?.label ?? '',
    role: textos.fields.role?.label ?? '',
    need: textos.fields.need?.label ?? '',
    message: textos.fields.message?.label ?? '',
  }

  const listaErrores = (Object.keys(errores) as (keyof typeof errores)[])
    .filter((k) => errores[k])
    .map((k) => ({
      id: idDe(k === 'privacy' ? 'privacy' : k),
      label: k === 'privacy' ? textos.consent : etiquetas[k as keyof Campos],
      mensaje: errores[k] as string,
    }))

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-5" noValidate>
      {mostrarResumen && (
        <ResumenErrores
          titulo={msg('summaryTitle')}
          errores={listaErrores}
          refEnfocable={resumen}
        />
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id={idDe('firstName')}
          nombre="firstName"
          label={etiquetas.firstName}
          requerido
          etiquetaRequerido={a11yRequerido}
          valor={campos.firstName}
          onChange={actualizar('firstName')}
          onBlur={alSalirDe('firstName')}
          error={errores.firstName}
          placeholder={textos.fields.firstName?.placeholder}
          autoComplete="given-name"
        />
        <CampoTexto
          id={idDe('lastName')}
          nombre="lastName"
          label={etiquetas.lastName}
          requerido
          etiquetaRequerido={a11yRequerido}
          valor={campos.lastName}
          onChange={actualizar('lastName')}
          onBlur={alSalirDe('lastName')}
          error={errores.lastName}
          placeholder={textos.fields.lastName?.placeholder}
          autoComplete="family-name"
        />
        <CampoTexto
          id={idDe('company')}
          nombre="company"
          label={etiquetas.company}
          requerido
          etiquetaRequerido={a11yRequerido}
          valor={campos.company}
          onChange={actualizar('company')}
          onBlur={alSalirDe('company')}
          error={errores.company}
          placeholder={textos.fields.company?.placeholder}
          autoComplete="organization"
        />
        <CampoTexto
          id={idDe('email')}
          nombre="email"
          tipo="email"
          label={etiquetas.email}
          requerido
          etiquetaRequerido={a11yRequerido}
          valor={campos.email}
          onChange={actualizar('email')}
          onBlur={alSalirDe('email')}
          error={errores.email}
          ayuda={aviso ?? undefined}
          placeholder={textos.fields.email?.placeholder}
          autoComplete="email"
          inputMode="email"
        />
        <CampoTexto
          id={idDe('phone')}
          nombre="phone"
          tipo="tel"
          label={etiquetas.phone}
          valor={campos.phone}
          onChange={actualizar('phone')}
          placeholder={textos.fields.phone?.placeholder}
          autoComplete="tel"
          inputMode="tel"
        />
        <CampoTexto
          id={idDe('role')}
          nombre="role"
          label={etiquetas.role}
          valor={campos.role}
          onChange={actualizar('role')}
          placeholder={textos.fields.role?.placeholder}
          autoComplete="organization-title"
        />
      </div>

      <CampoSelect
        id={idDe('need')}
        nombre="need"
        label={etiquetas.need}
        requerido
        etiquetaRequerido={a11yRequerido}
        valor={campos.need}
        onChange={actualizar('need')}
        onBlur={alSalirDe('need')}
        error={errores.need}
        placeholder={textos.fields.need?.placeholder}
        opciones={textos.needOptions.map((o) => ({ valor: o, etiqueta: o }))}
      />

      <CampoTextarea
        id={idDe('message')}
        nombre="message"
        label={etiquetas.message}
        valor={campos.message}
        onChange={actualizar('message')}
        onBlur={alSalirDe('message')}
        error={errores.message}
        placeholder={textos.fields.message?.placeholder}
        maximo={MAX_MENSAJE}
      />

      {/* Informacion basica en capas, visible sin desplegar nada. La AEPD pide
          que este junto al formulario, no escondida tras un enlace. */}
      <details className="border-border bg-panel/50 rounded-[10px] border p-4">
        <summary className="font-display cursor-pointer text-xs font-bold">
          {textos.privacyBasicInfo.title}
        </summary>
        <dl className="mt-3 flex flex-col gap-2">
          {textos.privacyBasicInfo.rows.map((fila) => (
            <div key={fila.label} className="text-xs">
              <dt className="font-display text-cyan inline font-bold">{fila.label}: </dt>
              <dd className="text-text-dim inline">{fila.value}</dd>
            </div>
          ))}
        </dl>
        <a href={privacyHref} className="text-cyan mt-3 inline-block text-xs underline">
          {textos.privacyBasicInfo.moreLabel}
        </a>
      </details>

      <CampoCasilla
        id={idDe('privacy')}
        nombre="privacy"
        marcada={privacidad}
        onChange={(v) => {
          setPrivacidad(v)
          if (v) setErrores((e) => ({ ...e, privacy: undefined }))
        }}
        error={errores.privacy}
      >
        {textos.consent}{' '}
        <a href={privacyHref} className="text-cyan underline">
          {textos.privacyLinkLabel}
        </a>
      </CampoCasilla>

      {/* Separada, opcional y sin premarcar. */}
      <CampoCasilla
        id={idDe('marketing')}
        nombre="marketing"
        marcada={marketing}
        onChange={setMarketing}
      >
        {textos.marketing}
      </CampoCasilla>

      {/* Honeypot: invisible para las personas, visible para los bots que
          rellenan todo. Fuera del flujo accesible y fuera de la pantalla, no con
          `display: none`, que algunos bots detectan. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={idDe('hp')}>No rellenar</label>
        <input id={idDe('hp')} name="empresa_web" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" variante="primario" tamano="lg" disabled={estado === 'enviando'}>
          {textos.submit}
        </Button>
        <p className="text-text-dim text-xs">{textos.responseNote}</p>
      </div>

      <p className="text-text-dim text-xs">{textos.requiredNote}</p>

      {errorGeneral && (
        <p role="alert" className="text-alert text-sm">
          {errorGeneral}
        </p>
      )}
    </form>
  )
}
