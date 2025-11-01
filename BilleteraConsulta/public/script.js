// Variables globales
let chartInstance = null;
let historialConsultas = [];
let currentTheme = 'light';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarHistorial();
    cargarTemaGuardado();
    
    // Event listener para Enter en el textarea
    document.getElementById('preguntaInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            realizarConsulta();
        }
    });
});

// Manejo del tema
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Actualizar ícono del botón
    const themeBtn = document.querySelector('.theme-toggle');
    themeBtn.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    
    // Guardar preferencia
    localStorage.setItem('billeteraConsulta_theme', currentTheme);
    
    // Actualizar gráfico si existe
    if (chartInstance) {
        actualizarColoresGrafico();
    }
}

function cargarTemaGuardado() {
    const savedTheme = localStorage.getItem('billeteraConsulta_theme') || 'light';
    currentTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    const themeBtn = document.querySelector('.theme-toggle');
    themeBtn.textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

// Realizar consulta financiera
async function realizarConsulta() {
    const preguntaInput = document.getElementById('preguntaInput');
    const pregunta = preguntaInput.value.trim();
    
    if (!pregunta) {
        mostrarError('Por favor, escribe una pregunta');
        return;
    }
    
    // Mostrar estado de carga
    mostrarLoading(true);
    ocultarResultados();
    
    try {
        const response = await fetch('/api/consulta', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pregunta })
        });
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Guardar en historial
        guardarEnHistorial(pregunta, data);
        
        // Mostrar resultados
        mostrarResultados(data);
        
        // Limpiar input
        preguntaInput.value = '';
        
    } catch (error) {
        console.error('Error en la consulta:', error);
        mostrarError('No se pudo procesar tu consulta. Por favor intenta nuevamente.');
    } finally {
        mostrarLoading(false);
    }
}

// Mostrar/ocultar estado de carga
function mostrarLoading(mostrar) {
    const loadingState = document.getElementById('loadingState');
    const consultarBtn = document.getElementById('consultarBtn');
    
    if (mostrar) {
        loadingState.classList.remove('hidden');
        consultarBtn.disabled = true;
        consultarBtn.textContent = '⏳ Consultando...';
    } else {
        loadingState.classList.add('hidden');
        consultarBtn.disabled = false;
        consultarBtn.textContent = '🚀 Consultar';
    }
}

// Mostrar resultados en el dashboard
function mostrarResultados(data) {
    // Respuesta principal
    document.getElementById('respuestaPrincipal').textContent = data.respuesta_principal || 'No se obtuvo respuesta';
    
    // Recomendaciones
    mostrarRecomendaciones(data.recomendaciones || []);
    
    // Gráfico
    if (data.datos_visualizacion) {
        mostrarGrafico(data.datos_visualizacion);
    }
    
    // Consejos
    mostrarConsejos(data.consejos || []);
    
    // Estadísticas
    mostrarEstadisticas(data);
    
    // Mostrar panel de resultados
    document.getElementById('resultadosPanel').classList.remove('hidden');
    
    // Scroll a resultados
    document.getElementById('resultadosPanel').scrollIntoView({ behavior: 'smooth' });
}

// Mostrar recomendaciones
function mostrarRecomendaciones(recomendaciones) {
    const container = document.getElementById('recomendacionesContainer');
    container.innerHTML = '';
    
    if (recomendaciones.length === 0) {
        container.innerHTML = '<p class="text-secondary">No hay recomendaciones disponibles</p>';
        return;
    }
    
    recomendaciones.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'recomendacion-item';
        
        const ventajasList = rec.ventajas && rec.ventajas.length > 0 
            ? `<ul class="ventajas-list">${rec.ventajas.map(v => `<li>${v}</li>`).join('')}</ul>`
            : '';
            
        const desventajasList = rec.desventajas && rec.desventajas.length > 0 
            ? `<ul class="desventajas-list">${rec.desventajas.map(d => `<li>${d}</li>`).join('')}</ul>`
            : '';
        
        item.innerHTML = `
            <h5>${rec.nombre || 'Opción no especificada'}</h5>
            <div class="badges">
                <span class="rendimiento-badge">${rec.rendimiento_estimado || 'No especificado'}</span>
                <span class="comision-badge">${rec.comisiones || 'No especificado'}</span>
            </div>
            ${ventajasList ? `<div class="ventajas"><strong>✅ Ventajas:</strong>${ventajasList}</div>` : ''}
            ${desventajasList ? `<div class="desventajas"><strong>❌ Desventajas:</strong>${desventajasList}</div>` : ''}
        `;
        
        container.appendChild(item);
    });
}

// Mostrar gráfico con Chart.js
function mostrarGrafico(datos) {
    const ctx = document.getElementById('datosChart').getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    const isDarkTheme = currentTheme === 'dark';
    const textColor = isDarkTheme ? '#f1f5f9' : '#1e293b';
    const gridColor = isDarkTheme ? '#334155' : '#e2e8f0';
    
    const config = {
        type: datos.tipo_grafico || 'bar',
        data: {
            labels: datos.categorias || [],
            datasets: [{
                label: 'Datos Financieros',
                data: datos.valores || [],
                backgroundColor: [
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(6, 182, 212, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderColor: [
                    'rgba(79, 70, 229, 1)',
                    'rgba(6, 182, 212, 1)',
                    'rgba(16, 185, 129, 1)',
                    'rgba(245, 158, 11, 1)',
                    'rgba(239, 68, 68, 1)',
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: datos.tipo_grafico === 'pie',
                    labels: {
                        color: textColor
                    }
                },
                title: {
                    display: true,
                    text: 'Análisis Comparativo',
                    color: textColor,
                    font: {
                        size: 16
                    }
                }
            },
            scales: datos.tipo_grafico !== 'pie' ? {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: textColor,
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: gridColor
                    }
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            } : {}
        }
    };
    
    chartInstance = new Chart(ctx, config);
}

// Actualizar colores del gráfico al cambiar tema
function actualizarColoresGrafico() {
    if (!chartInstance) return;
    
    const isDarkTheme = currentTheme === 'dark';
    const textColor = isDarkTheme ? '#f1f5f9' : '#1e293b';
    const gridColor = isDarkTheme ? '#334155' : '#e2e8f0';
    
    chartInstance.options.plugins.legend.labels.color = textColor;
    chartInstance.options.plugins.title.color = textColor;
    
    if (chartInstance.options.scales.y) {
        chartInstance.options.scales.y.ticks.color = textColor;
        chartInstance.options.scales.y.grid.color = gridColor;
    }
    
    if (chartInstance.options.scales.x) {
        chartInstance.options.scales.x.ticks.color = textColor;
        chartInstance.options.scales.x.grid.color = gridColor;
    }
    
    chartInstance.update();
}

// Mostrar consejos
function mostrarConsejos(consejos) {
    const container = document.getElementById('consejosContainer');
    container.innerHTML = '';
    
    if (consejos.length === 0) {
        container.innerHTML = '<li class="text-secondary">No hay consejos disponibles</li>';
        return;
    }
    
    consejos.forEach(consejo => {
        const li = document.createElement('li');
        li.textContent = consejo;
        container.appendChild(li);
    });
}

// Mostrar estadísticas
function mostrarEstadisticas(data) {
    const container = document.getElementById('estadisticasContainer');
    container.innerHTML = '';
    
    const estadisticas = [
        {
            label: 'Recomendaciones',
            value: (data.recomendaciones || []).length
        },
        {
            label: 'Consejos',
            value: (data.consejos || []).length
        },
        {
            label: 'Tipo de análisis',
            value: data.datos_visualizacion?.tipo_grafico || 'N/A'
        },
        {
            label: 'Fecha de consulta',
            value: new Date().toLocaleDateString('es-AR')
        }
    ];
    
    estadisticas.forEach(est => {
        const item = document.createElement('div');
        item.className = 'estadistica-item';
        item.innerHTML = `
            <span class="estadistica-label">${est.label}</span>
            <span class="estadistica-value">${est.value}</span>
        `;
        container.appendChild(item);
    });
}

// Manejo del historial
function toggleHistorial() {
    const panel = document.getElementById('historialPanel');
    panel.classList.toggle('active');
}

function guardarEnHistorial(pregunta, respuesta) {
    const consulta = {
        id: Date.now(),
        pregunta: pregunta,
        respuesta: respuesta,
        fecha: new Date().toISOString()
    };
    
    historialConsultas.unshift(consulta);
    
    // Mantener solo las últimas 20 consultas
    if (historialConsultas.length > 20) {
        historialConsultas = historialConsultas.slice(0, 20);
    }
    
    // Guardar en localStorage
    localStorage.setItem('billeteraConsulta_historial', JSON.stringify(historialConsultas));
    
    // Actualizar vista del historial
    actualizarVistaHistorial();
}

function cargarHistorial() {
    const guardado = localStorage.getItem('billeteraConsulta_historial');
    if (guardado) {
        try {
            historialConsultas = JSON.parse(guardado);
            actualizarVistaHistorial();
        } catch (error) {
            console.error('Error cargando historial:', error);
            historialConsultas = [];
        }
    }
}

function actualizarVistaHistorial() {
    const container = document.getElementById('historialContainer');
    container.innerHTML = '';
    
    if (historialConsultas.length === 0) {
        container.innerHTML = '<p class="text-center text-secondary">No hay consultas anteriores</p>';
        return;
    }
    
    historialConsultas.forEach(consulta => {
        const item = document.createElement('div');
        item.className = 'historial-item';
        item.onclick = () => cargarConsulta(consulta);
        
        const fecha = new Date(consulta.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-AR') + ' ' + fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        
        item.innerHTML = `
            <div class="historial-pregunta">${consulta.pregunta}</div>
            <div class="historial-fecha">${fechaFormateada}</div>
        `;
        
        container.appendChild(item);
    });
}

function cargarConsulta(consulta) {
    // Cargar la pregunta en el input
    document.getElementById('preguntaInput').value = consulta.pregunta;
    
    // Mostrar los resultados
    mostrarResultados(consulta.respuesta);
    
    // Cerrar el panel de historial
    toggleHistorial();
    
    // Scroll a resultados
    document.getElementById('resultadosPanel').scrollIntoView({ behavior: 'smooth' });
}

function limpiarHistorial() {
    if (confirm('¿Estás seguro de que quieres eliminar todo el historial de consultas?')) {
        historialConsultas = [];
        localStorage.removeItem('billeteraConsulta_historial');
        actualizarVistaHistorial();
    }
}

// Funciones utilitarias
function cerrarResultados() {
    document.getElementById('resultadosPanel').classList.add('hidden');
}

function ocultarResultados() {
    document.getElementById('resultadosPanel').classList.add('hidden');
}

function mostrarError(mensaje) {
    // Crear elemento de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: var(--error-color);
        color: white;
        padding: 1rem;
        border-radius: var(--radius);
        margin: 1rem 0;
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2000;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    errorDiv.textContent = mensaje;
    
    document.body.appendChild(errorDiv);
    
    // Auto-eliminar después de 3 segundos
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 3000);
}

// Exportar funciones para uso global
window.realizarConsulta = realizarConsulta;
window.toggleHistorial = toggleHistorial;
window.limpiarHistorial = limpiarHistorial;
window.cerrarResultados = cerrarResultados;
window.toggleTheme = toggleTheme;
