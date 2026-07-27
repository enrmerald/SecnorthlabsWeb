import Link from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Boton del sistema de diseno (ISNLA-DOC-0004-04 seccion 1, mockup image2.png).
 *
 * Tres variantes, y una regla del brief que hay que respetar al componer cada
 * pagina: **un solo primario por vista**. Si dos botones compiten por ser la
 * accion principal, ninguno lo es.
 *
 * Renderiza `<button>`, `<Link>` o `<a>` segun lo que reciba. No es una
 * comodidad: un enlace que se pinta como boton pero es un `<div>` con onClick
 * no se puede abrir en una pestana nueva, no aparece en la navegacion por
 * teclado y no lo anuncia un lector de pantalla.
 */
export type VarianteBoton = 'primario' | 'secundario' | 'ghost'
export type TamanoBoton = 'md' | 'lg'

const BASE = [
  'inline-flex items-center justify-center gap-2',
  'font-display font-bold text-center',
  'rounded-[10px] border transition-colors',
  // Objetivo tactil de 44px de alto minimo, sin excepciones (seccion 1.6).
  'min-h-11',
  'disabled:opacity-50 disabled:pointer-events-none',
].join(' ')

const VARIANTES: Record<VarianteBoton, string> = {
  // Relleno verde, texto oscuro. Es el unico que puede repetirse una vez por
  // vista.
  primario: 'bg-green text-bg border-green hover:bg-green/85 active:bg-green/75',
  // Relleno cian, texto oscuro.
  secundario: 'bg-cyan text-bg border-cyan hover:bg-cyan/85 active:bg-cyan/75',
  // Borde de 1px sobre transparente.
  ghost: 'bg-transparent text-text border-border hover:border-cyan hover:text-cyan',
}

const TAMANOS: Record<TamanoBoton, string> = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-[0.9375rem]',
}

interface PropsComunes {
  variante?: VarianteBoton
  tamano?: TamanoBoton
  /** Ocupa todo el ancho disponible. En movil suele ser lo correcto. */
  ancho?: boolean
  className?: string
  children: ReactNode
}

type PropsEnlace = PropsComunes & {
  href: string
  /** Abre en pestana nueva y anade rel="noopener noreferrer". */
  externo?: boolean
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof PropsComunes | 'href'>

type PropsBoton = PropsComunes & {
  href?: undefined
  externo?: never
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof PropsComunes>

export type PropsButton = PropsEnlace | PropsBoton

export function Button(props: PropsButton) {
  const {
    variante = 'primario',
    tamano = 'md',
    ancho = false,
    className = '',
    children,
    externo = false,
    ...resto
  } = props

  const clases = [BASE, VARIANTES[variante], TAMANOS[tamano], ancho ? 'w-full' : '', className]
    .filter(Boolean)
    .join(' ')

  if (resto.href === undefined) {
    const atributos = resto as ButtonHTMLAttributes<HTMLButtonElement>
    return (
      <button type="button" className={clases} {...atributos}>
        {children}
      </button>
    )
  }

  const { href, ...atributos } = resto as { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>

  // `rel="noopener noreferrer"` no es opcional en los enlaces externos: sin el,
  // la pagina de destino recibe una referencia a esta por window.opener.
  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases} {...atributos}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={clases} {...atributos}>
      {children}
    </Link>
  )
}
