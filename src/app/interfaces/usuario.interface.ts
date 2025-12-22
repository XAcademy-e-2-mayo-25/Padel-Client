export interface Usuario {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  dni: string | null;
  email: string;
  fotoPerfil: string | null;
  provincia: string | null;
  localidad: string | null;
  idCategoria: number | null;
  telefono: string | null;
  direccion: string | null;
}
