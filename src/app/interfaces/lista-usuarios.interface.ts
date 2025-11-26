export interface ParamListarUsuario {
  page?: number;
  limit?: number;
  sortBy?: 'idUsuario' | 'nombres' | 'apellidos' | 'email' | 'idCategoria';
  sortDir?: 'ASC' | 'DESC' | 'asc' | 'desc';
  nombre?: string;
  email?: string;
  idCategoria?: number;
  idRol?: number;
  idEstado?: number;
  idPosicion?: number;
}
