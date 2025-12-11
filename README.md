# Sistema de Gestión de Inventario con Predicción de Stock

Sistema full-stack de gestión de inventario con capacidades de machine learning para predicción de stock y análisis de reabastecimiento.

## 🚀 Características

- **Gestión de Inventario**: Visualización paginada de productos con búsqueda en tiempo real
- **Predicción de Stock**: Integración con modelo ML para predecir niveles de stock futuro
- **Análisis de Restock**: Análisis automatizado de productos que necesitan reabastecimiento
- **Reentrenamiento del Modelo**: Sistema de reentrenamiento con carga masiva de datos CSV
- **División Automática de Lotes**: Manejo inteligente de archivos grandes con división automática en caso de error 413

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** con TypeScript
- **Vite** como build tool
- **Tailwind CSS** para estilos
- **Custom Hooks** para manejo de estado

### Backend
- **Express.js** con TypeScript
- **Bun** como runtime
- **MySQL** con mysql2/promise
- **CORS** habilitado

### Machine Learning
- API externa de predicción (Google Cloud Run)
- Servicio local de reentrenamiento

## 📋 Requisitos Previos

- Bun (última versión)
- Node.js 18+
- MySQL 8.0+
- Servicio de ML ejecutándose (puerto 1919)

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd aprendizaje
```

2. Instalar dependencias:
```bash
bun install
```

3. Configurar base de datos MySQL:
   - Crear base de datos `aprendizaje`
   - Importar esquema desde `/Dump20251013/`
   - Configurar credenciales en `src/data_acces/maria.ts`

4. Configurar variables de entorno (opcional):
   - API de predicción: `https://stock-retrain-service-18474533500.us-central1.run.app/api/v1/predict`
   - API de reentrenamiento: `http://localhost:1919/api/v1/retrain`

## 🚀 Uso

### Desarrollo

Iniciar frontend y backend simultáneamente:
```bash
bun run dev:full
```

O ejecutarlos por separado:

```bash
# Solo frontend (puerto 5173)
bun run dev

# Solo backend (puerto 3000)
bun run server
```

### Producción

```bash
bun run build
bun run preview
```

## 📁 Estructura del Proyecto

```
aprendizaje/
├── src/
│   ├── data_acces/          # Capa de acceso a datos
│   │   ├── maria.ts         # Configuración MySQL
│   │   ├── inventario_acces.ts  # CRUD inventario
│   │   └── db/schema/       # Interfaces TypeScript
│   ├── hooks/               # React hooks personalizados
│   │   └── useInventario.ts # Hook principal de inventario
│   ├── pages/               # Componentes de páginas
│   │   └── Productos.tsx    # Página de productos
│   └── layout/              # Componentes de layout
├── server/
│   └── index.ts             # Servidor Express
├── Dump20251013/            # Dump de base de datos
└── public/                  # Archivos estáticos
```

## 🔌 API Endpoints

### Inventario
- `GET /api/inventario?page=1&limit=50` - Obtener inventario paginado
- `GET /api/inventario/:id` - Obtener producto por ID
- `GET /api/inventario/search/:term` - Buscar productos

### Predicción & Análisis
- `POST /api/predict` - Predecir stock de un producto
  ```json
  {
    "product_id": 123,
    "date": "2025-12-31"
  }
  ```

- `POST /api/check-restock` - Analizar necesidad de restock
  ```json
  {
    "date": "2025-12-31",
    "threshold": 10,
    "page": 1,
    "limit": 50
  }
  ```

- `POST /api/retrain` - Reentrenar modelo ML
  ```json
  {
    "data": [
      {
        "product_id": 1,
        "created_at": "2025-01-01",
        "salida": 10,
        "quantity_on_hand": 100,
        "unit_cost": 25.50,
        "dia_semana": 1,
        "mes": 1,
        "fin_semana": 0,
        "feriado": 0
      }
    ]
  }
  ```

## 📊 Funcionalidades Principales

### 1. Visualización de Inventario
- Tabla paginada con 50 productos por página
- Búsqueda por código, nombre o descripción
- Indicadores visuales para stock bajo

### 2. Predicción de Stock
- Seleccionar producto y fecha objetivo
- Visualizar stock estimado para fecha futura
- Información de días adelante y nivel predicho

### 3. Análisis de Restock
- Análisis paginado de todos los productos
- Umbral de seguridad configurable
- Cálculo automático de:
  - Cantidad necesaria para restock
  - Costo por producto
  - Inversión total requerida
- Navegación entre páginas de análisis

### 4. Reentrenamiento del Modelo
- Carga de archivos CSV
- Validación de campos requeridos
- División automática de lotes grandes
- Procesamiento paralelo de batches

## 🔐 Configuración de Base de Datos

El sistema utiliza la tabla `kard_entradas` para obtener el stock real de cada producto:

```sql
SELECT 
  i.*,
  (SELECT ke.cantidad 
   FROM kard_entradas ke 
   WHERE ke.id_item = i.Id 
   ORDER BY ke.kardexId DESC 
   LIMIT 1) as cantidad
FROM inventario i
```

## 📝 Formato CSV para Reentrenamiento

El archivo CSV debe contener las siguientes columnas:

```csv
product_id,created_at,salida,quantity_on_hand,unit_cost,dia_semana,mes,fin_semana,feriado
1,2025-01-15,10,100,25.50,3,1,0,0
2,2025-01-16,5,50,15.00,4,1,0,0
```

## 🐛 Solución de Problemas

### Error 413 (Payload Too Large)
- El sistema automáticamente divide archivos grandes en lotes más pequeños
- Límite configurado en 50MB por defecto
- Se puede ajustar en `server/index.ts`

### Conexión a Base de Datos
- Verificar credenciales en `src/data_acces/maria.ts`
- Asegurar que MySQL esté ejecutándose
- Verificar nombre de base de datos: `aprendizaje`

### Servicios ML No Disponibles
- Verificar que el servicio de reentrenamiento esté en puerto 1919
- API de predicción debe estar accesible en Cloud Run

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 👥 Contribución

Para contribuir al proyecto, por favor seguir las guías de estilo TypeScript y React establecidas.
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
