# BilleteraConsulta - Asesor Financiero con IA

Un MVP de aplicación de consultas financieras que utiliza la API de Gemini 2.5 Flash para proporcionar análisis y recomendaciones financieras personalizadas.

## 🚀 Características

- **Consultas financieras inteligentes**: Realiza preguntas sobre finanzas y recibe respuestas detalladas
- **Visualizaciones interactivas**: Gráficos dinámicos con Chart.js para mejor comprensión
- **Historial de consultas**: Guarda tus consultas anteriores en LocalStorage
- **Diseño responsive**: Funciona perfectamente en desktop y móviles
- **Datos en tiempo real**: Integración con APIs financieras externas
- **Dashboard moderno**: Interfaz intuitiva con cards, paneles y estadísticas

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** + **Express**: Servidor web robusto
- **Gemini 2.5 Flash API**: Procesamiento de lenguaje natural
- **Alpha Vantage API**: Datos financieros en tiempo real
- **CORS**: Comunicación entre frontend y backend
- **dotenv**: Manejo de variables de entorno

### Frontend
- **HTML5**, **CSS3**, **JavaScript Vanilla**: Sin dependencias pesadas
- **Chart.js**: Visualizaciones de datos interactivas
- **LocalStorage**: Persistencia de historial local
- **Diseño responsive**: Mobile-first approach

## 📋 Requisitos Previos

- Node.js (versión 14 o superior)
- npm o yarn
- API Key de Gemini 2.5 Flash (ya configurada)

## 🚀 Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   cd BilleteraConsulta
   npm install
   ```

2. **Configurar variables de entorno**:
   El archivo `.env` ya está configurado con tu API key:
   ```
   GEMINI_API_KEY=gen-lang-client-0897138866
   PORT=3000
   ```

3. **Iniciar el servidor**:
   ```bash
   npm start
   ```
   O para desarrollo con auto-reload:
   ```bash
   npm run dev
   ```

4. **Abrir la aplicación**:
   Navega a `http://localhost:3000` en tu navegador

## 📊 Uso de la Aplicación

### Realizar Consultas
1. Escribe tu pregunta financiera en el campo de texto
2. Ejemplos de consultas:
   - "¿Cuál es la billetera con mejor rendimiento en Argentina?"
   - "¿Qué criptomonedas recomiendas invertir?"
   - "¿Cuáles son las mejores opciones de plazo fijo?"
3. Presiona el botón "Consultar" o Enter
4. Visualiza los resultados en el dashboard interactivo

### Características del Dashboard
- **Respuesta Principal**: Análisis detallado de tu consulta
- **Recomendaciones**: Opciones específicas con ventajas/desventajas
- **Gráficos Interactivos**: Visualización de datos comparativos
- **Consejos Importantes**: Recomendaciones financieras clave
- **Estadísticas**: Métricas rápidas del análisis

### Historial de Consultas
- Accede al historial mediante el botón "📊 Historial"
- Revisa consultas anteriores con fecha y hora
- Carga rápidamente consultas previas
- Limpia el historial cuando lo necesites

## 🔧 Estructura del Proyecto

```
BilleteraConsulta/
├── server.js              # Servidor backend con Express
├── package.json           # Dependencias y scripts
├── .env                   # Variables de entorno
├── public/                # Archivos frontend
│   ├── index.html        # Página principal
│   ├── styles.css        # Estilos CSS
│   └── script.js         # Lógica JavaScript
└── README.md             # Documentación
```

## 🌐 Endpoints de la API

### POST /api/consulta
Recibe preguntas financieras y devuelve análisis estructurado.

**Request**:
```json
{
  "pregunta": "¿Cuál es la billetera con mejor rendimiento en Argentina?"
}
```

**Response**:
```json
{
  "respuesta_principal": "Análisis detallado...",
  "recomendaciones": [...],
  "datos_visualizacion": {...},
  "consejos": [...]
}
```

## 🎨 Personalización

### Colores y Tema
Los colores están definidos en CSS variables (`:root`):
- `--primary-color`: Color principal (#4f46e5)
- `--secondary-color`: Color secundario (#06b6d4)
- `--success-color`: Color para éxito (#10b981)
- `--warning-color`: Color para advertencias (#f59e0b)
- `--error-color`: Color para errores (#ef4444)

### API Key
Para cambiar la API key de Gemini, modifica el archivo `.env`:
```
GEMINI_API_KEY=tu-nueva-api-key
```

## 🚀 Mejoras Futuras

- [ ] Integración con más APIs financieras
- [ ] Autenticación de usuarios
- [ ] Base de datos para persistencia
- [ ] Más tipos de gráficos y visualizaciones
- [ ] Exportación de reportes en PDF
- [ ] Notificaciones de alertas financieras
- [ ] Modo oscuro/claro

## 📝 Notas Importantes

- La aplicación utiliza la clave demo de Alpha Vantage para datos financieros
- El historial se almacena localmente en el navegador
- Las respuestas son generadas por IA y deben ser verificadas
- Para producción, considera implementar autenticación y base de datos

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:
1. Fork del proyecto
2. Crear una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit de los cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crear un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

**Desarrollado con ❤️ y Gemini AI**
