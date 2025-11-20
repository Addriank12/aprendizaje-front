import { useState, useEffect } from "react";
import type { Inventario } from "../data_acces/db/schema/inventario";

const API_URL = "http://localhost:3000/api";

interface StockPrediction {
  days_ahead: number;
  prediccion_salida: number;
  product_id: number;
  stock_estimado: number;
  target_date: string;
  product_info?: {
    id: number;
    codigo?: string;
    item?: string;
    current_stock: number;
  };
  analysis?: string | null;
}

interface RetrainData {
  product_id: number;
  created_at: string;
  salida: number;
  quantity_on_hand: number;
  unit_cost: number;
  dia_semana: number;
  mes: number;
  fin_semana: number;
  feriado: number;
}

interface RetrainResponse {
  message?: string;
  status?: string;
  [key: string]: any;
}

interface RestockItem {
  product_id: number;
  codigo?: string;
  item?: string;
  current_stock: number;
  predicted_stock: number;
  safety_threshold: number;
  restock_amount: number;
  predicted_shortage: boolean;
  unit_cost?: string;
  total_cost: number;
  days_ahead: number;
  target_date: string;
}

interface RestockResponse {
  date: string;
  safety_threshold: number;
  page: number;
  limit: number;
  total_pages: number;
  total_products_in_db: number;
  products_analyzed_in_page: number;
  products_needing_restock: number;
  total_restock_cost: number;
  restock_list: RestockItem[];
}

interface UseInventarioResult {
  inventario: Inventario[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  searchTerm: string;
  predicting: boolean;
  predictionError: string | null;
  retraining: boolean;
  retrainError: string | null;
  checkingRestock: boolean;
  restockError: string | null;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refresh: () => void;
  search: (term: string) => void;
  clearSearch: () => void;
  predictStock: (
    product_id: number,
    date: string
  ) => Promise<StockPrediction | null>;
  retrainModel: (data: RetrainData[]) => Promise<RetrainResponse | null>;
  checkRestock: (
    date: string,
    threshold?: number,
    page?: number,
    limit?: number
  ) => Promise<RestockResponse | null>;
}

export const useInventario = (
  itemsPerPage: number = 50
): UseInventarioResult => {
  const [inventario, setInventario] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [predicting, setPredicting] = useState<boolean>(false);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [retraining, setRetraining] = useState<boolean>(false);
  const [retrainError, setRetrainError] = useState<string | null>(null);
  const [checkingRestock, setCheckingRestock] = useState<boolean>(false);
  const [restockError, setRestockError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const fetchInventario = async (currentPage: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/inventario?page=${currentPage}&limit=${itemsPerPage}`
      );

      if (!response.ok) {
        throw new Error("Error al obtener el inventario");
      }

      const result = await response.json();
      setInventario(result.data);
      setTotalCount(result.pagination.total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el inventario"
      );
      setInventario([]);
    } finally {
      setLoading(false);
    }
  };

  const searchInventario = async (term: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/inventario/search/${encodeURIComponent(term)}`
      );

      if (!response.ok) {
        throw new Error("Error al buscar en el inventario");
      }

      const result = await response.json();
      setInventario(result);
      setTotalCount(result.length);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al buscar en el inventario"
      );
      setInventario([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      searchInventario(searchTerm);
    } else {
      fetchInventario(page);
    }
  }, [page, itemsPerPage, searchTerm]);

  const nextPage = () => {
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const goToPage = (targetPage: number) => {
    if (targetPage >= 1 && targetPage <= totalPages) {
      setPage(targetPage);
    }
  };

  const refresh = () => {
    if (searchTerm) {
      searchInventario(searchTerm);
    } else {
      fetchInventario(page);
    }
  };

  const search = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setPage(1);
  };

  const predictStock = async (
    product_id: number,
    date: string
  ): Promise<StockPrediction | null> => {
    setPredicting(true);
    setPredictionError(null);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id,
          date,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al obtener la predicción");
      }

      const prediction: StockPrediction = await response.json();
      return prediction;
    } catch (err) {
      setPredictionError(
        err instanceof Error ? err.message : "Error al predecir stock"
      );
      return null;
    } finally {
      setPredicting(false);
    }
  };

  const retrainModel = async (
    data: RetrainData[]
  ): Promise<RetrainResponse | null> => {
    setRetraining(true);
    setRetrainError(null);

    try {
      const response = await fetch(`${API_URL}/retrain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      });

      if (!response.ok) {
        throw new Error("Error al reentrenar el modelo");
      }

      const result: RetrainResponse = await response.json();
      return result;
    } catch (err) {
      setRetrainError(
        err instanceof Error ? err.message : "Error al reentrenar el modelo"
      );
      return null;
    } finally {
      setRetraining(false);
    }
  };

  const checkRestock = async (
    date: string,
    threshold: number = 10,
    page: number = 1,
    limit: number = 50
  ): Promise<RestockResponse | null> => {
    setCheckingRestock(true);
    setRestockError(null);

    try {
      const response = await fetch(`${API_URL}/check-restock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date,
          threshold,
          page,
          limit,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al verificar necesidad de restock");
      }

      const result: RestockResponse = await response.json();
      return result;
    } catch (err) {
      setRestockError(
        err instanceof Error
          ? err.message
          : "Error al verificar necesidad de restock"
      );
      return null;
    } finally {
      setCheckingRestock(false);
    }
  };

  return {
    inventario,
    loading,
    error,
    page,
    totalPages,
    searchTerm,
    predicting,
    predictionError,
    retraining,
    retrainError,
    checkingRestock,
    restockError,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    search,
    clearSearch,
    predictStock,
    retrainModel,
    checkRestock,
  };
};

export default useInventario;
