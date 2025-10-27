// ===== CONFIGURACIÓN =====
const GEMINI_API_KEY = 'AIzaSyA3id3UCwm86Fl8venv-2OTU1N1VdU-vX0';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ===== ELEMENTOS DEL DOM =====
const elements = {
    // Upload
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    uploadBtn: document.getElementById('uploadBtn'),
    previewContainer: document.getElementById('previewContainer'),
    previewImg: document.getElementById('previewImg'),
    changeImageBtn: document.getElementById('changeImageBtn'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    
    // Sections
    uploadSection: document.getElementById('uploadSection'),
    loadingSection: document.getElementById('loadingSection'),
    resultsSection: document.getElementById('resultsSection'),
    
    // Results
    dishName: document.getElementById('dishName'),
    cuisineType: document.getElementById('cuisineType'),
    mealCategory: document.getElementById('mealCategory'),
    ingredientsList: document.getElementById('ingredientsList'),
    calories: document.getElementById('calories'),
    protein: document.getElementById('protein'),
    carbs: document.getElementById('carbs'),
    fats: document.getElementById('fats'),
    healthInsights: document.getElementById('healthInsights'),
    dietRecommendations: document.getElementById('dietRecommendations'),
    allergensWarnings: document.getElementById('allergensWarnings'),
    
    // Actions
    newAnalysisBtn: document.getElementById('newAnalysisBtn'),
    themeToggle: document.getElementById('themeToggle')
};

// ===== ESTADO DE LA APLICACIÓN =====
let currentImage = null;
let currentTheme = localStorage.getItem('theme') || 'light';

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupEventListeners();
    setupDragAndDrop();
});

// ===== CONFIGURACIÓN DEL TEMA =====
function initializeTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const icon = elements.themeToggle.querySelector('i');
    icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function setupEventListeners() {
    // Upload events
    elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    elements.changeImageBtn.addEventListener('click', resetUpload);
    elements.analyzeBtn.addEventListener('click', analyzeImage);
    elements.newAnalysisBtn.addEventListener('click', resetToUpload);
    
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Upload area click
    elements.uploadArea.addEventListener('click', () => elements.fileInput.click());
}

// ===== DRAG AND DROP =====
function setupDragAndDrop() {
    const uploadArea = elements.uploadArea;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        });
    });
    
    uploadArea.addEventListener('drop', handleDrop);
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

// ===== MANEJO DE ARCHIVOS =====
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecciona un archivo de imagen válido', 'error');
        return;
    }
    
    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('La imagen es demasiado grande. Máximo 10MB', 'error');
        return;
    }
    
    currentImage = file;
    displayImage(file);
}

function displayImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        elements.previewImg.src = e.target.result;
        elements.uploadArea.style.display = 'none';
        elements.previewContainer.style.display = 'block';
        
        // Animación de entrada
        elements.previewContainer.style.animation = 'fadeInUp 0.5s ease-out';
    };
    
    reader.readAsDataURL(file);
}

// ===== ANÁLISIS DE IMAGEN =====
async function analyzeImage() {
    if (!currentImage) {
        showNotification('Por favor, selecciona una imagen primero', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const analysisResult = await analyzeWithGemini(currentImage);
        displayResults(analysisResult);
    } catch (error) {
        console.error('Error en el análisis:', error);
        showNotification('Error al analizar la imagen. Por favor, intenta de nuevo.', 'error');
        hideLoading();
    }
}

async function analyzeWithGemini(imageFile) {
    // Convertir imagen a base64
    const base64Image = await fileToBase64(imageFile);
    
    // Prompt detallado para Gemini
    const prompt = `Actúa como un nutricionista experto y analiza esta imagen de comida. Proporciona un análisis completo en formato JSON con la siguiente estructura:

{
  "dishName": "Nombre del plato detectado",
  "cuisineType": "Tipo de cocina (ej: italiana, mexicana, asiática, mediterránea, etc.)",
  "mealCategory": "Categoría del plato (ej: desayuno, almuerzo, cena, postre, snack)",
  "ingredients": ["ingrediente1", "ingrediente2", "ingrediente3"],
  "nutrition": {
    "calories": "número aproximado de calorías",
    "protein": "cantidad de proteínas en gramos",
    "carbs": "cantidad de carbohidratos en gramos",
    "fats": "cantidad de grasas en gramos"
  },
  "healthInsights": [
    "insight 1 sobre beneficios para la salud",
    "insight 2 sobre propiedades nutricionales",
    "insight 3 sobre valor nutricional general"
  ],
  "dietRecommendations": [
    "recomendación dietética 1",
    "recomendación dietética 2",
    "recomendación dietética 3"
  ],
  "allergensWarnings": [
    "advertencia sobre alérgenos comunes",
    "advertencia sobre posibles contraindicaciones"
  ]
}

Analiza la imagen cuidadosamente y proporciona estimaciones realistas basadas en los ingredientes visibles. Sé específico pero conservador en tus estimaciones nutricionales. Responde ÚNICAMENTE con el JSON, sin texto adicional.`;

    const requestBody = {
        contents: [{
            parts: [
                {
                    text: prompt
                },
                {
                    inline_data: {
                        mime_type: imageFile.type,
                        data: base64Image.split(',')[1]
                    }
                }
            ]
        }]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const textResponse = data.candidates[0].content.parts[0].text;
        
        // Extraer JSON de la respuesta
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('No se pudo extraer JSON de la respuesta');
        }
    } else {
        throw new Error('Respuesta inválida de la API');
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// ===== MOSTRAR RESULTADOS =====
function displayResults(data) {
    // Información general
    elements.dishName.textContent = data.dishName || 'No detectado';
    elements.cuisineType.textContent = data.cuisineType || 'No especificado';
    elements.mealCategory.textContent = data.mealCategory || 'No categorizado';
    
    // Ingredientes
    displayIngredients(data.ingredients || []);
    
    // Nutrición
    displayNutrition(data.nutrition || {});
    
    // Insights de salud
    displayListItems(elements.healthInsights, data.healthInsights || [], 'insight-item');
    
    // Recomendaciones dietéticas
    displayListItems(elements.dietRecommendations, data.dietRecommendations || [], 'recommendation-item');
    
    // Advertencias
    displayListItems(elements.allergensWarnings, data.allergensWarnings || [], 'warning-item');
    
    hideLoading();
    showResults();
}

function displayIngredients(ingredients) {
    elements.ingredientsList.innerHTML = '';
    
    ingredients.forEach(ingredient => {
        const tag = document.createElement('span');
        tag.className = 'ingredient-tag';
        tag.textContent = ingredient;
        elements.ingredientsList.appendChild(tag);
    });
    
    if (ingredients.length === 0) {
        elements.ingredientsList.innerHTML = '<p style="color: var(--text-secondary);">No se detectaron ingredientes</p>';
    }
}

function displayNutrition(nutrition) {
    elements.calories.textContent = nutrition.calories || '0 kcal';
    elements.protein.textContent = nutrition.protein || '0g';
    elements.carbs.textContent = nutrition.carbs || '0g';
    elements.fats.textContent = nutrition.fats || '0g';
}

function displayListItems(container, items, itemClass) {
    container.innerHTML = '';
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = itemClass;
        div.innerHTML = `<i class="fas fa-check-circle"></i> ${item}`;
        container.appendChild(div);
    });
    
    if (items.length === 0) {
        container.innerHTML = `<p style="color: var(--text-secondary);">No hay información disponible</p>`;
    }
}

// ===== NAVEGACIÓN ENTRE SECCIONES =====
function showLoading() {
    elements.uploadSection.style.display = 'none';
    elements.resultsSection.style.display = 'none';
    elements.loadingSection.style.display = 'block';
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideLoading() {
    elements.loadingSection.style.display = 'none';
}

function showResults() {
    elements.resultsSection.style.display = 'block';
    
    // Animación de entrada para las cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

function resetUpload() {
    elements.fileInput.value = '';
    elements.previewContainer.style.display = 'none';
    elements.uploadArea.style.display = 'block';
    currentImage = null;
}

function resetToUpload() {
    resetUpload();
    elements.resultsSection.style.display = 'none';
    elements.uploadSection.style.display = 'block';
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== NOTIFICACIONES =====
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Estilos para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 300px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Añadir al DOM
    document.body.appendChild(notification);
    
    // Evento para cerrar
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// ===== ANIMACIONES ADICIONALES =====
const style = document.createElement('style');
style.textContent = `
    .drag-over {
        border-color: var(--primary-color) !important;
        background: rgba(16, 185, 129, 0.05) !important;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1rem;
        padding: 0;
        opacity: 0.8;
        transition: opacity 0.2s;
    }
    
    .notification-close:hover {
        opacity: 1;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .insight-item i,
    .recommendation-item i,
    .warning-item i {
        color: var(--primary-color);
        margin-right: 0.5rem;
    }
    
    .warning-item i {
        color: var(--danger-color);
    }
`;
document.head.appendChild(style);

// ===== MANEJO DE ERRORES =====
window.addEventListener('error', (e) => {
    console.error('Error global:', e.error);
    showNotification('Ha ocurrido un error inesperado', 'error');
});

// ===== OPTIMIZACIÓN DE PERFORMANCE =====
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Recalcular layouts si es necesario
        console.log('Window resized');
    }, 250);
});

// ===== SERVICE WORKER PARA OFFLINE (FUTURO) =====
if ('serviceWorker' in navigator) {
    // Aquí se podría registrar un service worker para funcionalidad offline
    console.log('Service Worker disponible');
}

console.log('NutriAI - Aplicación inicializada correctamente');
