import express from "express";
import cors from "cors";
import InventarioAccess from "../src/data_acces/inventario_acces";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" })); // Aumentar límite de payload
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

    // Obtener datos del producto
    const product = await InventarioAccess.getById(product_id);

    if (!product) {
      return res.status(404).json({
        error: "Producto no encontrado",
        message: `No se encontró el producto con ID ${product_id}`,
      });
    }

    // Obtener predicción
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

    // Obtener análisis del chat
    let analysis = null;
    try {
      const pregunta = `Actúa como experto en logística. Revisa el producto ${product_id} (${
        product.item
      }, código: ${product.codigo}). Stock actual: ${
        product.cantidad || 0
      } unidades. ¿Cuál es la predicción para el ${new Date(
        date
      ).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}? El stock predecido es ${prediction.stock_predicho.toFixed(
        2
      )}, fecha objetivo: ${
        prediction.target_date
      }). La fecha actual es: ${new Date().toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}. En una respuesta máxima de entre 50 y 100 palabras`;
      console.log(pregunta);
      const chatResponse = await fetch(
        "https://stock-retrain-service-18474533500.us-central1.run.app/api/v1/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pregunta,
          }),
        }
      );

      if (chatResponse.ok) {
        const chatResult = await chatResponse.json();
        analysis =
          chatResult.respuesta_ia ||
          chatResult.respuesta ||
          chatResult.analysis ||
          chatResult.message ||
          (typeof chatResult === "string" ? chatResult : null);
        console.log("Respuesta del chat recibida:", analysis);
      } else {
        console.warn(`Chat API respondió con status ${chatResponse.status}`);
      }
    } catch (chatError) {
      console.error("Error al obtener análisis del chat:", chatError);
      // No fallar si el chat no está disponible
    }

    console.log("Análisis final:", analysis);

    res.json({
      ...prediction,
      product_info: {
        id: product.Id,
        codigo: product.codigo,
        item: product.item,
        current_stock: product.cantidad || 0,
      },
      analysis,
    });
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

    // Función para enviar un lote de datos con manejo de error 413
    const sendBatch = async (batch: any[], batchSize: number): Promise<any> => {
      try {
        const response = await fetch(
          "https://stock-retrain-service-18474533500.us-central1.run.app/api/v1/retrain",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: batch }),
          }
        );

        // Si obtenemos error 413 (Payload Too Large), dividir el lote
        if (response.status === 413) {
          if (batch.length === 1) {
            throw new Error(
              "Un solo registro es demasiado grande para procesar"
            );
          }

          console.log(
            `Error 413: Dividiendo lote de ${batch.length} registros en lotes más pequeños`
          );

          // Dividir en dos mitades
          const halfSize = Math.floor(batch.length / 2);
          const firstHalf = batch.slice(0, halfSize);
          const secondHalf = batch.slice(halfSize);

          // Procesar cada mitad recursivamente
          const [result1, result2] = await Promise.all([
            sendBatch(firstHalf, halfSize),
            sendBatch(secondHalf, batch.length - halfSize),
          ]);

          return {
            message: "Reentrenamiento completado en múltiples lotes",
            batches_processed:
              (result1.batches_processed || 1) +
              (result2.batches_processed || 1),
            total_records: batch.length,
          };
        }

        if (!response.ok) {
          throw new Error(
            `Error en la API de reentrenamiento: ${response.status} ${response.statusText}`
          );
        }

        const result = await response.json();
        return result;
      } catch (error) {
        if (error instanceof Error && error.message.includes("413")) {
          // Si el error 413 viene del fetch mismo, dividir
          if (batch.length === 1) {
            throw new Error(
              "Un solo registro es demasiado grande para procesar"
            );
          }

          console.log(
            `Error de tamaño: Dividiendo lote de ${batch.length} registros`
          );

          const halfSize = Math.floor(batch.length / 2);
          const firstHalf = batch.slice(0, halfSize);
          const secondHalf = batch.slice(halfSize);

          const [result1, result2] = await Promise.all([
            sendBatch(firstHalf, halfSize),
            sendBatch(secondHalf, batch.length - halfSize),
          ]);

          return {
            message: "Reentrenamiento completado en múltiples lotes",
            batches_processed:
              (result1.batches_processed || 1) +
              (result2.batches_processed || 1),
            total_records: batch.length,
          };
        }
        throw error;
      }
    };

    // Intentar enviar todos los datos
    const result = await sendBatch(data, data.length);

    res.json({
      ...result,
      total_records_sent: data.length,
    });
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
    const allPredictions = [];
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
          const predictedStock = prediction.stock_predicho || 0;
          const restockAmount = Math.max(0, safetyThreshold - predictedStock);

          const productData = {
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
            target_date: prediction.target_date,
          };

          allPredictions.push(productData);

          // Si el stock predicho está por debajo del umbral, necesita restock
          if (predictedStock < safetyThreshold) {
            restockNeeded.push(productData);
          }
        }
      } catch (err) {
        console.error(`Error predicting for product ${product.Id}:`, err);
        // Continuar con el siguiente producto
      }
    }

    // Ordenar por cantidad de restock necesaria (descendente)
    allPredictions.sort((a, b) => b.restock_amount - a.restock_amount);

    const totalPages = Math.ceil(totalProducts / itemsPerPage);
    const totalRestockCost = restockNeeded.reduce(
      (sum, p) => sum + p.total_cost,
      0
    );

    // Obtener análisis del chat sobre el restock
    let analysis = null;
    try {
      const pregunta = `Actúa como experto en gestión de inventarios. Analiza el siguiente reporte de restock:

- Fecha de análisis: ${new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}
- Total de productos analizados en esta página: ${allPredictions.length}
- Productos que necesitan restock: ${restockNeeded.length}
- Inversión total requerida para restock: $${totalRestockCost.toFixed(2)}
- Umbral de seguridad establecido: ${safetyThreshold} unidades

${
  allPredictions.length > 0
    ? `Top 5 productos con mayor necesidad de restock:
${allPredictions
  .slice(0, 5)
  .map(
    (p, i) =>
      `${i + 1}. ${p.item || "Sin nombre"} (Código: ${
        p.codigo || "N/A"
      }) - Stock predicho: ${p.predicted_stock.toFixed(2)}, ${
        p.predicted_stock < safetyThreshold
          ? `Necesita ${
              p.restock_amount
            } unidades (Inversión: $${p.total_cost.toFixed(2)})`
          : "Stock suficiente"
      }`
  )
  .join("\n")}`
    : "No hay productos analizados en esta página."
}

Proporciona un análisis breve y profesional (máximo 100-150 palabras) con:
1. Evaluación general de la situación del inventario
2. Recomendaciones prioritarias
3. Alertas o consideraciones importantes`;

      console.log("Solicitando análisis de restock al chat...");
      const chatResponse = await fetch(
        "https://stock-retrain-service-18474533500.us-central1.run.app/api/v1/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pregunta,
          }),
        }
      );

      if (chatResponse.ok) {
        const chatResult = await chatResponse.json();
        analysis =
          chatResult.respuesta_ia ||
          chatResult.respuesta ||
          chatResult.analysis ||
          chatResult.message ||
          (typeof chatResult === "string" ? chatResult : null);
        console.log("Análisis de restock recibido:", analysis);
      } else {
        console.warn(
          `Chat API respondió con status ${chatResponse.status} para análisis de restock`
        );
      }
    } catch (chatError) {
      console.error(
        "Error al obtener análisis de restock del chat:",
        chatError
      );
      // No fallar si el chat no está disponible
    }

    res.json({
      date,
      safety_threshold: safetyThreshold,
      page: currentPage,
      limit: itemsPerPage,
      total_pages: totalPages,
      total_products_in_db: totalProducts,
      products_analyzed_in_page: allPredictions.length,
      products_needing_restock: restockNeeded.length,
      total_restock_cost: totalRestockCost,
      restock_list: allPredictions,
      analysis,
    });
  } catch (error) {
    console.error("Error al verificar restock:", error);
    res.status(500).json({
      error: "Error al verificar necesidad de restock",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

// Chat general con el sistema
app.post("/api/chat", async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta) {
      return res.status(400).json({
        error: "Parámetros faltantes",
        message: "Se requiere 'pregunta'",
      });
    }

    // Enviar pregunta al chat
    const chatResponse = await fetch(
      "https://stock-retrain-service-18474533500.us-central1.run.app/api/v1/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pregunta,
        }),
      }
    );

    if (!chatResponse.ok) {
      throw new Error(
        `Error en la API de chat: ${chatResponse.status} ${chatResponse.statusText}`
      );
    }

    const chatResult = await chatResponse.json();
    const respuesta =
      chatResult.respuesta_ia ||
      chatResult.respuesta ||
      chatResult.analysis ||
      chatResult.message ||
      (typeof chatResult === "string" ? chatResult : "No se obtuvo respuesta");

    res.json({
      pregunta,
      respuesta,
    });
  } catch (error) {
    console.error("Error en chat:", error);
    res.status(500).json({
      error: "Error al comunicarse con el chat",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});
