const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Inicializar Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// API externa gratuita de datos financieros (Alpha Vantage)
const ALPHA_VANTAGE_API_KEY = 'demo'; // Clave demo para desarrollo
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Función para obtener datos financieros reales
async function obtenerDatosFinancieros(tipo = 'market') {
  try {
    let response;
    
    switch(tipo) {
      case 'crypto':
        response = await axios.get(`${ALPHA_VANTAGE_BASE_URL}?function=DIGITAL_CURRENCY_DAILY&symbol=BTC&market=USD&apikey=${ALPHA_VANTAGE_API_KEY}`);
        break;
      case 'forex':
        response = await axios.get(`${ALPHA_VANTAGE_BASE_URL}?function=FX_DAILY&from_symbol=EUR&to_symbol=USD&apikey=${ALPHA_VANTAGE_API_KEY}`);
        break;
      case 'market':
      default:
        response = await axios.get(`${ALPHA_VANTAGE_BASE_URL}?function=GLOBAL_QUOTE&symbol=AAPL&apikey=${ALPHA_VANTAGE_API_KEY}`);
        break;
    }
    
    return response.data;
  } catch (error) {
    console.error('Error obteniendo datos financieros:', error);
    return null;
  }
}

// Endpoint principal para consultas financieras
app.post('/api/consulta', async (req, res) => {
  try {
    const { pregunta } = req.body;
    
    if (!pregunta) {
      return res.status(400).json({ error: 'La pregunta es requerida' });
    }

    // Obtener datos financieros actuales
    const datosFinancieros = await obtenerDatosFinancieros();
    
    // Construir el prompt para Gemini
    const prompt = `
Eres un experto financiero argentino. Analiza la siguiente pregunta del usuario y proporciona una respuesta detallada y útil.

Pregunta del usuario: "${pregunta}"

Contexto financiero actual:
${datosFinancieros ? JSON.stringify(datosFinancieros, null, 2) : 'No se pudieron obtener datos financieros en tiempo real'}

Instrucciones:
1. Responde en español argentino
2. Proporciona información precisa y actualizada sobre billeteras digitales, criptomonedas, y opciones de inversión en Argentina
3. Incluye comparativas de tasas, comisiones y rendimientos
4. Sugiere las mejores opciones según el contexto actual del mercado argentino
5. Estructura tu respuesta en formato JSON con la siguiente estructura:
{
  "respuesta_principal": "Tu respuesta principal detallada",
  "recomendaciones": [
    {
      "nombre": "Nombre de la billetera/opción",
      "ventajas": ["Ventaja 1", "Ventaja 2"],
      "desventajas": ["Desventaja 1"],
      "rendimiento_estimado": "XX% anual",
      "comisiones": "Bajas/Medias/Altas"
    }
  ],
  "datos_visualizacion": {
    "categorias": ["Categoría 1", "Categoría 2"],
    "valores": [valor1, valor2],
    "tipo_grafico": "bar" // o "pie", "line"
  },
  "consejos": ["Consejo 1", "Consejo 2"]
}

Responde únicamente con el JSON, sin texto adicional.
`;

    // Llamar a Gemini API
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Intentar parsear la respuesta como JSON
    let respuestaJSON;
    try {
      // Limpiar el texto para asegurar que sea JSON válido
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      respuestaJSON = JSON.parse(cleanedText);
    } catch (parseError) {
      console.log('Error parseando JSON, usando texto crudo:', parseError.message);
      // Si no es JSON, crear una estructura básica con el texto
      respuestaJSON = {
        respuesta_principal: text,
        recomendaciones: [],
        datos_visualizacion: {
          categorias: ["Análisis", "Procesando"],
          valores: [70, 30],
          tipo_grafico: "pie"
        },
        consejos: ["La respuesta está siendo procesada", "Intenta reformular tu pregunta para obtener resultados estructurados"]
      };
    }
    
    res.json(respuestaJSON);
    
  } catch (error) {
    console.error('Error en la consulta:', error);
    res.status(500).json({ 
      error: 'Error procesando la consulta',
      respuesta_principal: 'Lo siento, tuve un problema al procesar tu consulta. Por favor intenta nuevamente.',
      recomendaciones: [],
      datos_visualizacion: {
        categorias: ["Error"],
        valores: [100],
        tipo_grafico: "pie"
      },
      consejos: ["Intenta reformular tu pregunta", "Verifica tu conexión a internet"]
    });
  }
});

// Endpoint para obtener historial de consultas
app.get('/api/historial', (req, res) => {
  // Este endpoint podría conectarse a una base de datos en el futuro
  res.json({ message: 'Historial manejado en el frontend con LocalStorage' });
});

// Servir el frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`API Key de Gemini configurada: ${process.env.GEMINI_API_KEY ? '✓' : '✗'}`);
});
