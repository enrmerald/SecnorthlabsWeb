/**
 * Front matter de los articulos: **un subconjunto cerrado de YAML**, no YAML.
 *
 * El blog se autoriza como se autorizaba en Hugo -un `.md` por articulo, con
 * cabecera- pero el formato de esa cabecera aqui esta deliberadamente acotado a
 * tres formas: cadena entre comillas, escalar de una linea y lista en linea.
 *
 * Por que un subconjunto y no un parser de YAML completo: YAML tiene esquinas
 * que muerden en silencio -`no` se convierte en booleano, una tabulacion cambia
 * la estructura, un `:` dentro de un titulo sin comillas parte el valor-. Los
 * ficheros que venian del blog anterior traian ya tres variantes distintas de
 * cabecera y una de ellas ni siquiera era YAML valido. Con un subconjunto
 * estricto, cualquier desviacion es un error de build con fichero y linea, y no
 * un campo que llega vacio a produccion.
 *
 * Lo que se acepta, y nada mas:
 *
 * ```text
 * clave: "texto entre comillas, con : y , sin problema"
 * clave: escalar-sin-espacios-ni-comillas
 * clave: [uno, dos, tres]
 * # comentario
 * ```
 */

export type ValorFrontMatter = string | string[]

export interface FrontMatterSeparado {
  datos: Record<string, ValorFrontMatter>
  /** El Markdown, ya sin la cabecera. */
  cuerpo: string
  /** Linea en la que empieza el cuerpo, para que los errores sean utiles. */
  lineaDelCuerpo: number
}

const DELIMITADOR = '---'
const CLAVE = /^[a-zA-Z][a-zA-Z0-9]*$/

export class ErrorDeFrontMatter extends Error {
  constructor(fichero: string, linea: number, mensaje: string) {
    super(`${fichero}:${linea} · ${mensaje}`)
    this.name = 'ErrorDeFrontMatter'
  }
}

/** Descomilla una cadena, resolviendo `\"` y `\\`. */
function leerCadena(bruto: string, fichero: string, linea: number): string {
  let resultado = ''
  for (let i = 1; i < bruto.length; i += 1) {
    const caracter = bruto[i]
    if (caracter === '\\') {
      const siguiente = bruto[i + 1]
      if (siguiente !== '"' && siguiente !== '\\') {
        throw new ErrorDeFrontMatter(fichero, linea, `escape no valido: \\${siguiente ?? ''}`)
      }
      resultado += siguiente
      i += 1
      continue
    }
    if (caracter === '"') {
      if (i !== bruto.length - 1) {
        throw new ErrorDeFrontMatter(fichero, linea, 'sobra texto tras la comilla de cierre')
      }
      return resultado
    }
    resultado += caracter
  }
  throw new ErrorDeFrontMatter(fichero, linea, 'falta la comilla de cierre')
}

function leerValor(bruto: string, fichero: string, linea: number): ValorFrontMatter {
  if (bruto.startsWith('"')) return leerCadena(bruto, fichero, linea)

  if (bruto.startsWith('[')) {
    if (!bruto.endsWith(']')) {
      throw new ErrorDeFrontMatter(fichero, linea, 'la lista debe cerrarse en la misma linea')
    }
    const dentro = bruto.slice(1, -1).trim()
    if (dentro === '') return []
    if (dentro.includes('"')) {
      throw new ErrorDeFrontMatter(fichero, linea, 'las listas no admiten comillas')
    }
    return dentro.split(',').map((elemento) => elemento.trim()).filter(Boolean)
  }

  if (bruto.includes('#')) {
    throw new ErrorDeFrontMatter(fichero, linea, 'usa comillas si el valor lleva #')
  }
  return bruto
}

/**
 * Parte el fichero en cabecera y cuerpo. No valida el contenido de los campos:
 * de eso se encarga el esquema de `esquema.ts`, para que el error diga que falta
 * o que sobra y no solo que "algo no cuadra".
 */
export function separarFrontMatter(fuente: string, fichero: string): FrontMatterSeparado {
  // Los .md pueden llegar con CRLF desde Windows, y el BOM lo anade cualquier
  // editor sin avisar: los dos romperian la deteccion del delimitador.
  const lineas = fuente.replace(/^﻿/, '').replace(/\r\n/g, '\n').split('\n')

  if (lineas[0]?.trim() !== DELIMITADOR) {
    throw new ErrorDeFrontMatter(fichero, 1, `el fichero debe empezar por "${DELIMITADOR}"`)
  }

  const cierre = lineas.findIndex((linea, indice) => indice > 0 && linea.trim() === DELIMITADOR)
  if (cierre === -1) {
    throw new ErrorDeFrontMatter(fichero, lineas.length, `falta el "${DELIMITADOR}" de cierre`)
  }

  const datos: Record<string, ValorFrontMatter> = {}

  for (let indice = 1; indice < cierre; indice += 1) {
    const linea = lineas[indice] ?? ''
    const numero = indice + 1
    if (linea.trim() === '' || linea.trimStart().startsWith('#')) continue

    if (/^\s/.test(linea)) {
      throw new ErrorDeFrontMatter(fichero, numero, 'sin sangrado: cada campo va en una linea')
    }

    const separador: number = linea.indexOf(':')
    if (separador === -1) {
      throw new ErrorDeFrontMatter(fichero, numero, 'se esperaba "clave: valor"')
    }

    const clave = linea.slice(0, separador).trim()
    if (!CLAVE.test(clave)) {
      throw new ErrorDeFrontMatter(fichero, numero, `clave no valida: "${clave}"`)
    }
    if (clave in datos) {
      throw new ErrorDeFrontMatter(fichero, numero, `clave repetida: "${clave}"`)
    }

    datos[clave] = leerValor(linea.slice(separador + 1).trim(), fichero, numero)
  }

  return {
    datos,
    cuerpo: lineas.slice(cierre + 1).join('\n').trim(),
    lineaDelCuerpo: cierre + 2,
  }
}
