import { useState } from "react";
import { useInventario } from "../hooks/useInventario";

interface PredictionResult {
  productId: number;
  stock_predicho: number;
  target_date: string;
  product_info?: {
    id: number;
    codigo?: string;
    item?: string;
    current_stock: number;
  };
  analysis?: string | null;
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
  analysis?: string | null;
}

export const Productos = () => {
  const {
    inventario,
    loading,
    error,
    page,
    totalPages,
    searchTerm,
    nextPage,
    prevPage,
    goToPage,
    search,
    clearSearch,
    predictStock,
    predicting,
    predictionError,
    retrainModel,
    retraining,
    retrainError,
    checkRestock,
    checkingRestock,
    restockError,
  } = useInventario(50);

  const [inputValue, setInputValue] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [predictionDate, setPredictionDate] = useState("");
  const [predictionResult, setPredictionResult] =
    useState<PredictionResult | null>(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [showRetrainModal, setShowRetrainModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [retrainSuccess, setRetrainSuccess] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockDate, setRestockDate] = useState("");
  const [restockThreshold, setRestockThreshold] = useState(10);
  const [restockResult, setRestockResult] = useState<RestockResponse | null>(
    null
  );
  const [restockPage, setRestockPage] = useState(1);
  const [restockLimit] = useState(50);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      search(inputValue.trim());
    }
  };

  const handleClearSearch = () => {
    setInputValue("");
    clearSearch();
  };

  const handleOpenPrediction = (productId: number) => {
    setSelectedProductId(productId);
    setShowPredictionModal(true);
    setPredictionResult(null);
    setPredictionDate("");
  };

  const handleClosePrediction = () => {
    setShowPredictionModal(false);
    setSelectedProductId(null);
    setPredictionResult(null);
    setPredictionDate("");
  };

  const handlePredict = async () => {
    if (!selectedProductId || !predictionDate) return;

    const result = await predictStock(selectedProductId, predictionDate);
    console.log("Resultado de predicción recibido:", result);
    if (result) {
      console.log("Analysis en resultado:", result.analysis);
      setPredictionResult({
        productId: result.product_id,
        stock_predicho: result.stock_predicho,
        target_date: result.target_date,
        product_info: result.product_info,
        analysis: result.analysis,
      });
    }
  };

  const handleOpenRetrain = () => {
    setShowRetrainModal(true);
    setCsvFile(null);
    setRetrainSuccess(false);
  };

  const handleCloseRetrain = () => {
    setShowRetrainModal(false);
    setCsvFile(null);
    setRetrainSuccess(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const obj: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        // Convertir a número si es necesario
        if (
          [
            "product_id",
            "salida",
            "quantity_on_hand",
            "unit_cost",
            "dia_semana",
            "mes",
            "fin_semana",
            "feriado",
          ].includes(header)
        ) {
          obj[header] = parseFloat(value);
        } else {
          obj[header] = value;
        }
      });

      data.push(obj);
    }

    return data;
  };

  const handleRetrain = async () => {
    if (!csvFile) return;

    try {
      const text = await csvFile.text();
      const data = parseCSV(text);

      const result = await retrainModel(data);
      if (result) {
        setRetrainSuccess(true);
      }
    } catch (err) {
      console.error("Error al procesar CSV:", err);
    }
  };

  const handleOpenRestock = () => {
    setShowRestockModal(true);
    setRestockResult(null);
    setRestockDate("");
    setRestockPage(1);
  };

  const handleCloseRestock = () => {
    setShowRestockModal(false);
    setRestockResult(null);
    setRestockPage(1);
  };

  const handleCheckRestock = async () => {
    if (!restockDate) return;

    const result = await checkRestock(
      restockDate,
      restockThreshold,
      restockPage,
      restockLimit
    );
    if (result) {
      setRestockResult(result);
    }
  };

  const handleRestockPageChange = async (newPage: number) => {
    if (!restockDate) return;

    setRestockPage(newPage);
    const result = await checkRestock(
      restockDate,
      restockThreshold,
      newPage,
      restockLimit
    );
    if (result) {
      setRestockResult(result);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Cargando inventario...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventario de Productos</h1>
        <div className="flex gap-3">
          <button
            onClick={handleOpenRestock}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Análisis de Restock
          </button>
          <button
            onClick={handleOpenRetrain}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Reentrenar Modelo
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Buscar por código, nombre o descripción..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Limpiar
            </button>
          )}
        </form>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            Mostrando resultados para: <strong>{searchTerm}</strong>
          </div>
        )}
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Código
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Item
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Precio 1
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Precio 2
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Precio 3
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inventario.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No hay productos en el inventario
                </td>
              </tr>
            ) : (
              inventario.map((item) => (
                <tr
                  key={item.Id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.Id || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {item.codigo || "-"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {item.item || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`font-semibold ${
                        item.control_i && Number(item.cantidad || 0) < 10
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {item.cantidad?.toFixed(2) || "0.00"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${Number(item.pre1 || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${Number(item.pre2 || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    ${Number(item.pre3 || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenPrediction(item.Id)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-xs"
                    >
                      Predecir Stock
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Página {page} de {totalPages}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => goToPage(1)}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            &lt;&lt; Primera
          </button>
          <button
            onClick={prevPage}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            &lt; Anterior
          </button>

          {/* Números de página */}
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-2 rounded transition-colors ${
                    page === pageNum
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={nextPage}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente &gt;
          </button>
          <button
            onClick={() => goToPage(totalPages)}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Última &gt;&gt;
          </button>
        </div>
      </div>

      {/* Modal de Predicción */}
      {showPredictionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Predicción de Stock</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID del Producto
              </label>
              <input
                type="text"
                value={selectedProductId || ""}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Predicción
              </label>
              <input
                type="date"
                value={predictionDate}
                onChange={(e) => setPredictionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handlePredict}
              disabled={!predictionDate || predicting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {predicting ? "Prediciendo..." : "Obtener Predicción"}
            </button>

            {predictionError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {predictionError}
              </div>
            )}

            {predictionResult && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold text-green-800 mb-2">
                  Resultado de la Predicción
                </h3>
                <div className="space-y-2 text-sm">
                  {predictionResult.product_info && (
                    <div className="pb-2 border-b border-green-300">
                      <p>
                        <strong>Producto:</strong>{" "}
                        {predictionResult.product_info.item || "N/A"}
                      </p>
                      <p>
                        <strong>Código:</strong>{" "}
                        {predictionResult.product_info.codigo || "N/A"}
                      </p>
                      <p>
                        <strong>Stock Actual:</strong>{" "}
                        <span className="font-semibold">
                          {predictionResult.product_info.current_stock.toFixed(
                            2
                          )}
                        </span>
                      </p>
                    </div>
                  )}
                  <p>
                    <strong>Fecha objetivo:</strong>{" "}
                    {new Date(predictionResult.target_date).toLocaleDateString(
                      "es-ES"
                    )}
                  </p>
                  <p className="text-lg">
                    <strong>Stock predicho:</strong>{" "}
                    <span className="text-green-700 font-bold">
                      {predictionResult.stock_predicho.toFixed(2)}
                    </span>
                  </p>
                  {predictionResult.analysis && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="font-semibold text-green-800 mb-1">
                        Análisis:
                      </p>
                      <p className="text-gray-700 whitespace-pre-line">
                        {predictionResult.analysis}
                      </p>
                    </div>
                  )}
                  {!predictionResult.analysis && (
                    <div className="mt-3 pt-3 border-t border-orange-300 bg-orange-50 p-2 rounded">
                      <p className="text-orange-700 text-xs">
                        ℹ️ Análisis del chat no disponible. Verifica que el
                        servicio en puerto 1919 esté ejecutándose.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleClosePrediction}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Análisis de Restock */}
      {showRestockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Análisis de Restock</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Análisis
                </label>
                <input
                  type="date"
                  value={restockDate}
                  onChange={(e) => setRestockDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Umbral de Seguridad (unidades)
                </label>
                <input
                  type="number"
                  value={restockThreshold}
                  onChange={(e) => setRestockThreshold(Number(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button
              onClick={handleCheckRestock}
              disabled={!restockDate || checkingRestock}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {checkingRestock ? "Analizando..." : "Iniciar Análisis"}
            </button>

            {restockError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {restockError}
              </div>
            )}

            {restockResult && (
              <div className="mb-4">
                {restockResult.analysis && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <span className="mr-2">📊</span> Análisis Profesional
                    </h3>
                    <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
                      {restockResult.analysis}
                    </p>
                  </div>
                )}
                {!restockResult.analysis && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-700 text-xs">
                      ℹ️ Análisis del chat no disponible. Verifica que el
                      servicio en la API esté ejecutándose.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">
                      {restockResult.products_analyzed_in_page}
                    </div>
                    <div className="text-xs text-gray-600">
                      Productos Analizados (Página {restockResult.page}/
                      {restockResult.total_pages})
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">
                      {restockResult.total_products_in_db}
                    </div>
                    <div className="text-xs text-gray-600">Total en BD</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-700">
                      {restockResult.products_needing_restock}
                    </div>
                    <div className="text-xs text-gray-600">
                      Necesitan Restock (Esta Página)
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">
                      ${restockResult.total_restock_cost.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">
                      Inversión (Esta Página)
                    </div>
                  </div>
                </div>

                {restockResult.restock_list.length > 0 ? (
                  <div className="overflow-x-auto">
                    <h3 className="font-semibold text-lg mb-2">
                      Productos que Necesitan Restock
                    </h3>
                    <table className="min-w-full bg-white border border-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                            Código
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-700">
                            Producto
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                            Stock Actual
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                            Stock Predicho
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                            Umbral
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                            Cantidad Restock
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                            Costo Unit.
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-700">
                            Costo Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {restockResult.restock_list.map((item) => (
                          <tr
                            key={item.product_id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-2 text-sm">
                              {item.codigo || "-"}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {item.item || "-"}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {item.current_stock.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              <span className="text-red-600 font-semibold">
                                {item.predicted_stock.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              {item.safety_threshold.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              <span className="text-orange-600 font-semibold">
                                {item.restock_amount.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              $
                              {item.unit_cost
                                ? Number(item.unit_cost).toFixed(2)
                                : "0.00"}
                            </td>
                            <td className="px-4 py-2 text-sm text-right">
                              <span className="text-green-700 font-semibold">
                                ${item.total_cost.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 text-green-700 rounded-md text-center">
                    ✓ ¡Excelente! Ningún producto necesita restock según el
                    análisis.
                  </div>
                )}

                {/* Paginación del reporte */}
                {restockResult.total_pages > 1 && (
                  <div className="mt-4 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-700">
                      Página {restockResult.page} de {restockResult.total_pages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestockPageChange(1)}
                        disabled={restockResult.page === 1 || checkingRestock}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        &lt;&lt;
                      </button>
                      <button
                        onClick={() =>
                          handleRestockPageChange(restockResult.page - 1)
                        }
                        disabled={restockResult.page === 1 || checkingRestock}
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        &lt; Anterior
                      </button>
                      <button
                        onClick={() =>
                          handleRestockPageChange(restockResult.page + 1)
                        }
                        disabled={
                          restockResult.page === restockResult.total_pages ||
                          checkingRestock
                        }
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        Siguiente &gt;
                      </button>
                      <button
                        onClick={() =>
                          handleRestockPageChange(restockResult.total_pages)
                        }
                        disabled={
                          restockResult.page === restockResult.total_pages ||
                          checkingRestock
                        }
                        className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        &gt;&gt;
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCloseRestock}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Reentrenamiento */}
      {showRetrainModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Reentrenar Modelo</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo CSV
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="mt-2 text-xs text-gray-500">
                El CSV debe contener: product_id, created_at, salida,
                quantity_on_hand, unit_cost, dia_semana, mes, fin_semana,
                feriado
              </p>
            </div>

            <button
              onClick={handleRetrain}
              disabled={!csvFile || retraining}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {retraining ? "Reentrenando..." : "Iniciar Reentrenamiento"}
            </button>

            {retrainError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {retrainError}
              </div>
            )}

            {retrainSuccess && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                ✓ Modelo reentrenado exitosamente
              </div>
            )}

            <button
              onClick={handleCloseRetrain}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;
