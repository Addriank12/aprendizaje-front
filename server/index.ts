import express from "express";
import cors from "cors";
import InventarioAccess from "../src/data_acces/inventario_acces";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Obtener inventario paginado
app.get("/api/inventario", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const [data, count] = await Promise.all([
      InventarioAccess.getPaginated(page, limit),
      InventarioAccess.count(),
    ]);

    res.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    res.status(500).json({
      error: "Error al obtener el inventario",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Obtener item por ID
app.get("/api/inventario/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const item = await InventarioAccess.getById(id);

    if (!item) {
      return res.status(404).json({ error: "Item no encontrado" });
    }

    res.json(item);
  } catch (error) {
    console.error("Error al obtener item:", error);
    res.status(500).json({
      error: "Error al obtener el item",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Buscar inventario
app.get("/api/inventario/search/:term", async (req, res) => {
  try {
    const term = req.params.term;
    const data = await InventarioAccess.search(term);

    res.json(data);
  } catch (error) {
    console.error("Error al buscar:", error);
    res.status(500).json({
      error: "Error al buscar en el inventario",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Predicción de stock
app.post("/api/predict", async (req, res) => {
  try {
    const { product_id, date } = req.body;

    if (!product_id || !date) {
      return res.status(400).json({
        error: "Parámetros faltantes",
        message: "Se requieren product_id y date",
      });
    }

    const response = await fetch(
      "https://stock-retrain-service-18474533500.us-central1.run.app/api/v1/predict",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id,
          date,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Error en la API de predicción: ${response.statusText}`);
    }

    const prediction = await response.json();
    res.json(prediction);
  } catch (error) {
    console.error("Error al obtener predicción:", error);
    res.status(500).json({
      error: "Error al obtener la predicción",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Reentrenamiento del modelo
app.post("/api/retrain", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        error: "Datos inválidos",
        message: "Se requiere un array 'data' con al menos un elemento",
      });
    }

    // Validar estructura de cada elemento
    const requiredFields = [
      "product_id",
      "created_at",
      "salida",
      "quantity_on_hand",
      "unit_cost",
      "dia_semana",
      "mes",
      "fin_semana",
      "feriado",
    ];

    for (const item of data) {
      const missingFields = requiredFields.filter((field) => !(field in item));
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: "Datos incompletos",
          message: `Faltan campos requeridos: ${missingFields.join(", ")}`,
        });
      }
    }

    const response = await fetch("http://localhost:1919/api/v1/retrain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      throw new Error(
        `Error en la API de reentrenamiento: ${response.statusText}`
      );
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.error("Error al reentrenar modelo:", error);
    res.status(500).json({
      error: "Error al reentrenar el modelo",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Verificar restock necesario para productos
app.post("/api/check-restock", async (req, res) => {
  try {
    const { date, threshold, page, limit } = req.body;

    if (!date) {
      return res.status(400).json({
        error: "Parámetros faltantes",
        message: "Se requiere 'date' para la predicción",
      });
    }

    const safetyThreshold = threshold || 10; // Stock mínimo de seguridad
    const currentPage = page || 1;
    const itemsPerPage = limit || 50;

    // Obtener productos paginados
    const [products, totalProducts] = await Promise.all([
      InventarioAccess.getPaginated(currentPage, itemsPerPage),
      InventarioAccess.count(),
    ]);

    // Preparar predicciones para todos los productos
    const restockNeeded = [];

    for (const product of products) {
      try {
        const response = await fetch(
          "https://stock-retrain-service-18474533500.us-central1.run.app/api/v1/predict",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              product_id: product.Id,
              date,
            }),
          }
        );

        if (response.ok) {
          const prediction = await response.json();
          const currentStock = product.cantidad || 0;
          const predictedStock = prediction.stock_estimado || 0;

          // Si el stock predicho está por debajo del umbral, necesita restock
          if (predictedStock < safetyThreshold) {
            const restockAmount = Math.max(0, safetyThreshold - predictedStock);

            restockNeeded.push({
              product_id: product.Id,
              codigo: product.codigo,
              item: product.item,
              current_stock: currentStock,
              predicted_stock: predictedStock,
              safety_threshold: safetyThreshold,
              restock_amount: Math.ceil(restockAmount),
              predicted_shortage: predictedStock < 0,
              unit_cost: product.pre1,
              total_cost:
                Math.ceil(restockAmount) * parseFloat(product.pre1 || "0"),
              days_ahead: prediction.days_ahead,
              target_date: prediction.target_date,
            });
          }
        }
      } catch (err) {
        console.error(`Error predicting for product ${product.Id}:`, err);
        // Continuar con el siguiente producto
      }
    }

    // Ordenar por cantidad de restock necesaria (descendente)
    restockNeeded.sort((a, b) => b.restock_amount - a.restock_amount);

    const totalPages = Math.ceil(totalProducts / itemsPerPage);

    res.json({
      date,
      safety_threshold: safetyThreshold,
      page: currentPage,
      limit: itemsPerPage,
      total_pages: totalPages,
      total_products_in_db: totalProducts,
      products_analyzed_in_page: products.length,
      products_needing_restock: restockNeeded.length,
      total_restock_cost: restockNeeded.reduce(
        (sum, p) => sum + p.total_cost,
        0
      ),
      restock_list: restockNeeded,
    });
  } catch (error) {
    console.error("Error al verificar restock:", error);
    res.status(500).json({
      error: "Error al verificar necesidad de restock",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
