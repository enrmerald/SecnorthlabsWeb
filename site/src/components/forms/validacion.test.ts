import { describe, expect, it } from 'vitest'
// Ruta relativa y no el alias `@/`: esto importa VALORES, y el alias solo lo
// resuelve el bundler, no vitest.
import { MAX_MENSAJE, codigoDeError, esDominioGenerico } from './validacion'

/**
 * Pruebas de las reglas del formulario de contacto.
 *
 * Estas reglas vivian dentro del componente y no tenian ninguna prueba, siendo la
 * parte que decide si una consulta legitima se envia o se queda bloqueada. Lo que
 * se comprueba aqui no es que «valide», sino las decisiones concretas que estan
 * razonadas en el codigo y que un refactor podria deshacer sin que nada fallara.
 */

describe('exigirObligatorios: revisar sin dar la lata', () => {
  // Es la decision de diseno mas facil de perder: al salir de un campo vacio NO
  // se marca en rojo. Recorrer el formulario con el tabulador para ver que piden
  // es comportamiento normal.
  for (const campo of ['firstName', 'company', 'email', 'need'] as const) {
    it(`${campo} vacio no da error al salir del campo`, () => {
      expect(codigoDeError(campo, '', false)).toBeUndefined()
    })

    it(`${campo} vacio SI da error al enviar`, () => {
      expect(codigoDeError(campo, '', true)).toBe(campo)
    })
  }

  it('el contenido mal escrito si se avisa al salir, aunque no se exija el campo', () => {
    // Un correo mal formado se dice en el momento: es un favor, no una reganina.
    expect(codigoDeError('email', 'esto-no-es-un-correo', false)).toBe('email')
  })
})

describe('lastName es opcional', () => {
  // Hay nombres de una sola palabra, y quien escribe desde fuera de Espana puede
  // no tener «apellidos» en el sentido de aqui. La misma regla que el servidor y
  // que la calculadora: exigirlo perdia solicitudes legitimas.
  it('vacio no da error ni al enviar', () => {
    expect(codigoDeError('lastName', '', true)).toBeUndefined()
  })

  it('una sola letra tampoco', () => {
    expect(codigoDeError('lastName', 'O', true)).toBeUndefined()
  })

  it('pero se corta si se pasa de largo', () => {
    expect(codigoDeError('lastName', 'x'.repeat(61), false)).toBe('lastName')
    expect(codigoDeError('lastName', 'x'.repeat(60), false)).toBeUndefined()
  })
})

describe('limites de longitud', () => {
  it('firstName acepta de 2 a 40', () => {
    expect(codigoDeError('firstName', 'A', true)).toBe('firstName')
    expect(codigoDeError('firstName', 'Ana', true)).toBeUndefined()
    expect(codigoDeError('firstName', 'x'.repeat(40), true)).toBeUndefined()
    expect(codigoDeError('firstName', 'x'.repeat(41), true)).toBe('firstName')
  })

  it('company acepta de 2 a 80', () => {
    expect(codigoDeError('company', 'A', true)).toBe('company')
    expect(codigoDeError('company', 'x'.repeat(80), true)).toBeUndefined()
    expect(codigoDeError('company', 'x'.repeat(81), true)).toBe('company')
  })

  it('message se corta en MAX_MENSAJE, que es el del servidor', () => {
    expect(MAX_MENSAJE).toBe(1000)
    expect(codigoDeError('message', 'x'.repeat(MAX_MENSAJE), false)).toBeUndefined()
    expect(codigoDeError('message', 'x'.repeat(MAX_MENSAJE + 1), false)).toBe('message')
  })

  it('los espacios de los extremos no cuentan', () => {
    // Se recorta antes de medir, igual que hace el servidor: si no, un campo con
    // 40 caracteres y un espacio detras daria error sin motivo visible.
    expect(codigoDeError('firstName', '  Ana  ', true)).toBeUndefined()
    expect(codigoDeError('firstName', `  ${'x'.repeat(40)}  `, true)).toBeUndefined()
  })
})

describe('correo: laxo a proposito', () => {
  // La validacion estricta la hace el servidor. Una expresion agresiva aqui
  // rechaza direcciones validas delante de quien las esta escribiendo.
  for (const valido of [
    'ana@acme.example',
    'ana+etiqueta@acme.example',
    'ana.maria@sub.dominio.example',
    'a@b.co',
    'ana-maria@acme-industrial.example',
  ]) {
    it(`acepta ${valido}`, () => {
      expect(codigoDeError('email', valido, true)).toBeUndefined()
    })
  }

  for (const invalido of ['ana', 'ana@', '@acme.example', 'ana@acme', 'ana @acme.example']) {
    it(`rechaza ${JSON.stringify(invalido)}`, () => {
      expect(codigoDeError('email', invalido, true)).toBe('email')
    })
  }
})

describe('phone y role no validan nada', () => {
  // Y no deben: un telefono se escribe de diez formas distintas y todas son
  // buenas. Si algun dia se les pone una regla, esta prueba lo hara explicito.
  for (const campo of ['phone', 'role'] as const) {
    it(`${campo} acepta cualquier cosa, tambien vacio al enviar`, () => {
      expect(codigoDeError(campo, '', true)).toBeUndefined()
      expect(codigoDeError(campo, '+34 600 00 00 00 (ext. 12)', true)).toBeUndefined()
    })
  }
})

describe('esDominioGenerico: avisa, no bloquea', () => {
  for (const generico of [
    'ana@gmail.com',
    'ana@hotmail.es',
    'ana@Outlook.COM',
    'ana@yahoo.co.uk',
    'ana@live.com',
    'ana@icloud.com',
  ]) {
    it(`detecta ${generico}`, () => {
      expect(esDominioGenerico(generico)).toBe(true)
    })
  }

  it('un dominio corporativo no dispara el aviso', () => {
    expect(esDominioGenerico('ana@acme-industrial.example')).toBe(false)
  })

  it('detectarlo NO invalida el campo', () => {
    // La otra mitad de la decision: el aviso es suave. Quien solo tiene correo
    // personal -autonomos, empresas pequenas- tiene que poder enviar.
    expect(codigoDeError('email', 'ana@gmail.com', true)).toBeUndefined()
  })
})
