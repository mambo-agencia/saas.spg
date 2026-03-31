import { RolUsuario } from './enums'

export interface Usuario {
  id: string
  email: string
  nombre: string
  telefono?: string
  rol: RolUsuario
  matricula?: string
  activo: boolean
  ultimoLogin?: string
  createdAt: string
}

export interface Abogado {
  id: string
  nombre: string
  zona: 'zona_oeste' | 'zona_norte' | 'ambas'
  jurisdicciones: string[]
  matricula?: string
  direccion?: string
  domicilioElectronico?: string
  telefono?: string
  email?: string
  activo: boolean
}

export interface NotaUsuario {
  id: string
  usuarioId: string
  contenido: string
  completada: boolean
  orden: number
  createdAt: string
  updatedAt: string
}
