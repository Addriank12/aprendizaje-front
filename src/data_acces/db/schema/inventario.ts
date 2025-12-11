export interface Inventario {
  Id: number;
  codigo?: string;
  cod_aux?: string;
  item?: string;
  categoryid?: number;
  subcategoryid?: number;
  locationid?: number;
  brandid?: number;
  measureid?: number;
  imp?: number;
  ice?: number;
  descripcion?: string;
  pre1?: string;
  pre2?: string;
  pre3?: string;
  control_i?: boolean;
  stock?: string; // DEPRECADO: usar cantidad de kard_entradas
  cantidad?: number; // Stock real desde kard_entradas
}
