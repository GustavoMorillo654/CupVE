# CupVE - Monitor de Tasas de Cambio & Conversor de Divisas

CupVE es una aplicación web moderna inspirada en **alcambio.app** orientada a Venezuela. Permite consultar en tiempo real las tasas oficiales del **Banco Central de Venezuela (BCV)** para el Dólar y el Euro, así como las cotizaciones del mercado **Binance P2P** para **USDT** (precios de Compra, Venta y Promedio de referencia). Incluye un conversor interactivo bidireccional instantáneo con diseño **Dark Glassmorphism** y soporte para modo claro.

---

## 🚀 Características Principales

1. **Tasas Oficiales del BCV**:
   - Dólar oficial (USD/VES) con fecha y hora de publicación.
   - Euro oficial (EUR/VES).
2. **Mercado Cripto Binance P2P**:
   - Tasa de referencia (promedio de mercado).
   - Desglose de precios de mejores órdenes de **Compra** y **Venta**.
3. **Conversor Bidireccional en Tiempo Real**:
   - Ingreso de cualquier monto en divisa extranjera (ej. $20) y cálculo instantáneo en Bolívares (VES).
   - Ingreso de montos en Bolívares y cálculo inverso automático.
   - Botón de intercambio de monedas (*swap*).
   - Selector dinámico de tasa activa (BCV Dólar, BCV Euro, USDT Promedio, USDT Compra, USDT Venta).
   - Botones de selección de montos rápidos ($1, $5, $10, $20, $50, $100).
   - Botón para copiar el resultado al portapapeles con formato listo para compartir.
4. **Diseño Glassmorphism**:
   - Interfaz con efecto de vidrio esmerilado (*backdrop-filter blur*), sombras luminiscentes y gradientes sutiles.
   - Modo oscuro predeterminado con alternador a Modo Claro persistente en el navegador.
5. **Alto Rendimiento & Resiliencia**:
   - Backend en **FastAPI** con servicio de caché en memoria (TTL de 5 minutos) para respuestas < 50ms y protección contra bloqueos por rate-limit.
   - Frontend en **Vue 3 + Vite + TypeScript** con cálculos reactivos a 0ms de latencia en el cliente.

---

## 🛠️ Stack Tecnológico

- **Backend**: Python 3.14+, FastAPI, Uvicorn, HTTPX, Pydantic v2, Cachetools.
- **Frontend**: Vue 3 (Composition API `<script setup>`), Vite, TypeScript, Tailwind CSS, Lucide Icons.

---

## 📦 Estructura del Proyecto

```text
CupVE/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   └── rates.py            # Modelos Pydantic (camelCase serializado)
│   │   ├── routers/
│   │   │   └── rates.py            # Rutas /api/rates, /api/rates/refresh, /api/convert
│   │   ├── services/
│   │   │   └── rate_service.py     # Lógica de scraping/APIs y caché en memoria
│   │   └── main.py                 # Inicialización de FastAPI, CORS y precalentamiento
│   ├── requirements.txt            # Dependencias Python
│   └── .venv/                      # Entorno virtual
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── HeaderNavbar.vue    # Barra superior con estado en vivo y toggle de tema
│   │   │   ├── RateCard.vue        # Tarjetas de tasas con desglose de compra/venta
│   │   │   └── CurrencyConverter.vue # Conversor bidireccional interactivo
│   │   ├── composables/
│   │   │   ├── useRates.ts         # Peticiones, caché y temporizador regresivo
│   │   │   └── useConverter.ts     # Cálculos matemáticos y copiado
│   │   ├── types/
│   │   │   └── rates.ts            # Tipos e interfaces TypeScript
│   │   ├── App.vue                 # Vista y orquestación principal
│   │   ├── main.ts
│   │   └── style.css               # Reglas y componentes Glassmorphism
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts              # Configuración de proxy a FastAPI
├── start-backend.ps1               # Script de inicio rápido del backend
├── start-frontend.ps1              # Script de inicio rápido del frontend
└── README.md
```

---

## ⚡ Instrucciones de Ejecución

### 1. Backend (FastAPI)

En una terminal de PowerShell dentro de `CupVE/backend`:

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```

O simplemente ejecutando el script desde la raíz:
```powershell
.\start-backend.ps1
```

La documentación interactiva Swagger estará disponible en:
- `http://localhost:8000/docs`

### 2. Frontend (Vue 3 + Vite)

En una segunda terminal dentro de `CupVE/frontend`:

```powershell
npm run dev
```

O desde la raíz:
```powershell
.\start-frontend.ps1
```

Abre en tu navegador:
- `http://localhost:5173`

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/rates` | Obtiene todas las tasas (BCV USD, BCV EUR, USDT) con caché en memoria. |
| `POST` | `/api/rates/refresh` | Invalida la caché y obtiene los datos más recientes en vivo. |
| `POST` | `/api/convert` | Realiza conversiones entre divisas extranjeras y Bolívares. |
| `GET` | `/api/health` | Comprobación de estado del servicio. |
