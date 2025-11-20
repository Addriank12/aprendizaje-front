import pool from "./maria";
import type { Inventario } from "./db/schema/inventario";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export class InventarioAccess {
  // Obtener todos los registros de inventario con stock real
  static async getAll(): Promise<Inventario[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i`
    );
    return rows as Inventario[];
  }

  // Obtener un registro por ID con stock real
  static async getById(id: number): Promise<Inventario | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i
       WHERE i.Id = ?`,
      [id]
    );
    return rows.length > 0 ? (rows[0] as Inventario) : null;
  }

  // Obtener por código con stock real
  static async getByCodigo(codigo: string): Promise<Inventario | null> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i
       WHERE i.codigo = ?`,
      [codigo]
    );
    return rows.length > 0 ? (rows[0] as Inventario) : null;
  }

  // Buscar por término (código, cod_aux, item, descripcion) con stock real
  static async search(term: string): Promise<Inventario[]> {
    const searchTerm = `%${term}%`;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i
       WHERE i.codigo LIKE ? 
       OR i.cod_aux LIKE ? 
       OR i.item LIKE ? 
       OR i.descripcion LIKE ?`,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );
    return rows as Inventario[];
  }

  // Obtener por categoría con stock real
  static async getByCategory(categoryid: number): Promise<Inventario[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i
       WHERE i.categoryid = ?`,
      [categoryid]
    );
    return rows as Inventario[];
  }

  // Obtener por subcategoría con stock real
  static async getBySubcategory(subcategoryid: number): Promise<Inventario[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i
       WHERE i.subcategoryid = ?`,
      [subcategoryid]
    );
    return rows as Inventario[];
  }

  // Obtener por ubicación con stock real
  static async getByLocation(locationid: number): Promise<Inventario[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i
       WHERE i.locationid = ?`,
      [locationid]
    );
    return rows as Inventario[];
  }

  // Crear un nuevo registro
  static async create(inventario: Omit<Inventario, "Id">): Promise<number> {
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO inventario (
        codigo, cod_aux, item, categoryid, subcategoryid, 
        locationid, brandid, measureid, imp, ice, 
        descripcion, pre1, pre2, pre3, control_i, stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        inventario.codigo,
        inventario.cod_aux,
        inventario.item,
        inventario.categoryid,
        inventario.subcategoryid,
        inventario.locationid,
        inventario.brandid,
        inventario.measureid,
        inventario.imp,
        inventario.ice,
        inventario.descripcion,
        inventario.pre1,
        inventario.pre2,
        inventario.pre3,
        inventario.control_i,
        inventario.stock,
      ]
    );
    return result.insertId;
  }

  // Actualizar un registro
  static async update(
    id: number,
    inventario: Partial<Inventario>
  ): Promise<boolean> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(inventario).forEach(([key, value]) => {
      if (key !== "Id" && value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return false;

    values.push(id);
    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE inventario SET ${fields.join(", ")} WHERE Id = ?`,
      values
    );
    return result.affectedRows > 0;
  }

  // Eliminar un registro
  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM inventario WHERE Id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  // Obtener items con stock bajo (control_i activado y stock bajo)
  static async getLowStock(threshold: number = 10): Promise<Inventario[]> {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i
       WHERE i.control_i = true 
       AND (SELECT ke.cantidad 
            FROM kard_entradas ke 
            WHERE ke.id_item = i.Id 
            ORDER BY ke.kardexId DESC 
            LIMIT 1) < ?`,
      [threshold]
    );
    return rows as Inventario[];
  }

  // Contar total de registros
  static async count(): Promise<number> {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM inventario"
    );
    return rows[0].total;
  }

  // Obtener con paginación y stock real
  static async getPaginated(
    page: number = 1,
    limit: number = 50
  ): Promise<Inventario[]> {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT i.*, 
       (SELECT ke.cantidad 
        FROM kard_entradas ke 
        WHERE ke.id_item = i.Id 
        ORDER BY ke.kardexId DESC 
        LIMIT 1) as cantidad
       FROM inventario i
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows as Inventario[];
  }
}

export default InventarioAccess;
