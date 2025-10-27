// ===== CONFIGURACIÓN =====
const API_KEY = 'AIzaSyA3id3UCwm86Fl8venv-2OTU1N1VdU-vX0';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

// ===== ESTADO DE LA APLICACIÓN =====
let currentImage = null;
let detectedObjects = [];
let isAnalyzing = false;

// ===== ELEMENTOS DEL DOM =====
const elements = {
  fileInput: document.getElementById('fileInput'),
  uploadArea: document.getElementById('uploadArea'),
  uploadBtn: document.getElementById('uploadBtn'),
  removeBtn: document.getElementById('removeBtn'),
  analyzeBtn: document.getElementById('analyzeBtn'),
  previewContainer: document.getElementById('previewContainer'),
  previewImage: document.getElementById('previewImage'),
  resultsSection: document.getElementById('resultsSection'),
  emptyState: document.getElementById('emptyState'),
  cardsContainer: document.getElementById('cardsContainer'),
  tableBody: document.getElementById('tableBody'),
  objectCount: document.getElementById('objectCount'),
  themeToggle: document.getElementById('themeToggle'),
  themeIcon: document.querySelector('.theme-icon'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  btnText: document.querySelector('.btn-text'),
  btnLoader: document.querySelector('.btn-loader'),
  // Modal elements
  editModal: document.getElementById('editModal'),
  deleteModal: document.getElementById('deleteModal'),
  modalClose: document.getElementById('modalClose'),
  deleteModalClose: document.getElementById('deleteModalClose'),
  modalCancel: document.getElementById('modalCancel'),
  modalSave: document.getElementById('modalSave'),
  deleteCancel: document.getElementById('deleteCancel'),
  deleteConfirm: document.getElementById('deleteConfirm'),
  editForm: document.getElementById('editForm'),
  editName: document.getElementById('editName'),
  editCategory: document.getElementById('editCategory'),
  editDescription: document.getElementById('editDescription'),
  editDate: document.getElementById('editDate')
};

// ===== VARIABLES CRUD =====
let currentEditingId = null;
let currentDeletingId = null;

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupEventListeners();
  loadFromLocalStorage();
});

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function setupEventListeners() {
  // Upload events
  elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileSelect);
  elements.removeBtn.addEventListener('click', removeImage);
  elements.analyzeBtn.addEventListener('click', analyzeImage);

  // Drag and drop events
  elements.uploadArea.addEventListener('dragover', handleDragOver);
  elements.uploadArea.addEventListener('dragleave', handleDragLeave);
  elements.uploadArea.addEventListener('drop', handleDrop);

  // Theme toggle
  elements.themeToggle.addEventListener('click', toggleTheme);

  // Modal events
  elements.modalClose.addEventListener('click', closeEditModal);
  elements.modalCancel.addEventListener('click', closeEditModal);
  elements.deleteModalClose.addEventListener('click', closeDeleteModal);
  elements.deleteCancel.addEventListener('click', closeDeleteModal);
  elements.modalSave.addEventListener('click', saveEditChanges);
  elements.deleteConfirm.addEventListener('click', confirmDelete);

  // Form submission
  elements.editForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveEditChanges();
  });

  // Close modals on overlay click
  elements.editModal.addEventListener('click', (e) => {
    if (e.target === elements.editModal) {
      closeEditModal();
    }
  });

  elements.deleteModal.addEventListener('click', (e) => {
    if (e.target === elements.deleteModal) {
      closeDeleteModal();
    }
  });

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.addEventListener(eventName, preventDefaults, false);
  });
}

// ===== MANEJO DE ARCHIVOS =====
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    processImage(file);
  } else {
    showToast('Por favor selecciona un archivo de imagen válido', 'error');
  }
}

function handleDragOver(event) {
  event.preventDefault();
  elements.uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
  event.preventDefault();
  elements.uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
  event.preventDefault();
  elements.uploadArea.classList.remove('dragover');
  
  const files = event.dataTransfer.files;
  if (files.length > 0 && files[0].type.startsWith('image/')) {
    processImage(files[0]);
  } else {
    showToast('Por favor arrastra un archivo de imagen válido', 'error');
  }
}

function processImage(file) {
  currentImage = file;
  const reader = new FileReader();
  
  reader.onload = (e) => {
    elements.previewImage.src = e.target.result;
    elements.uploadArea.querySelector('.upload-content').style.display = 'none';
    elements.previewContainer.style.display = 'flex';
    elements.analyzeBtn.disabled = false;
    showToast('Imagen cargada correctamente', 'success');
  };
  
  reader.readAsDataURL(file);
}

function removeImage() {
  currentImage = null;
  elements.previewImage.src = '';
  elements.uploadArea.querySelector('.upload-content').style.display = 'block';
  elements.previewContainer.style.display = 'none';
  elements.analyzeBtn.disabled = true;
  elements.fileInput.value = '';
}

// ===== ANÁLISIS DE IMAGEN CON GEMINI AI =====
async function analyzeImage() {
  if (!currentImage || isAnalyzing) return;
  
  isAnalyzing = true;
  setAnalyzingState(true);
  
  try {
    const base64Image = await fileToBase64(currentImage);
    const analysis = await callGeminiAPI(base64Image);
    
    if (analysis.success) {
      const detectedObject = {
        id: Date.now(),
        image: elements.previewImage.src,
        name: analysis.data.name,
        category: analysis.data.category,
        description: analysis.data.description,
        date: new Date().toLocaleString('es-ES')
      };
      
      detectedObjects.push(detectedObject);
      updateUI();
      saveToLocalStorage();
      showToast('Análisis completado exitosamente', 'success');
    } else {
      showToast(analysis.error || 'Error en el análisis', 'error');
    }
  } catch (error) {
    console.error('Error en el análisis:', error);
    showToast('Ocurrió un error al analizar la imagen', 'error');
  } finally {
    isAnalyzing = false;
    setAnalyzingState(false);
  }
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function callGeminiAPI(base64Image) {
  const prompt = `Analiza esta imagen y responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "name": "nombre del objeto principal",
  "category": "categoría del objeto (ej: electrodoméstico, mueble, utensilio, decoración, etc.)",
  "description": "descripción breve y clara de lo que se ve en la imagen"
}

Instrucciones:
- Identifica el objeto principal o más destacado en la imagen
- Si no puedes identificar claramente ningún objeto, responde con:
{
  "name": "objeto desconocido",
  "category": "desconocido",
  "description": "no se pudo identificar claramente el objeto en la imagen"
}
- Sé específico pero conciso
- Enfócate en objetos cotidianos que se encontrarían en una casa
- NO incluyas texto adicional fuera del JSON`;

  const requestBody = {
    contents: [{
      parts: [
        {
          text: prompt
        },
        {
          inline_data: {
            mime_type: currentImage.type,
            data: base64Image
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 1,
      maxOutputTokens: 4096,
    }
  };

  try {
    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResponse) {
      throw new Error('Respuesta vacía de la API');
    }

    // Extraer JSON de la respuesta
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se encontró JSON válido en la respuesta');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    
    return {
      success: true,
      data: {
        name: parsedData.name || 'objeto no identificado',
        category: parsedData.category || 'desconocido',
        description: parsedData.description || 'no se pudo generar una descripción'
      }
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      success: false,
      error: error.message || 'Error al comunicarse con la API'
    };
  }
}

// ===== ACTUALIZACIÓN DE LA INTERFAZ =====
function updateUI() {
  if (detectedObjects.length === 0) {
    elements.resultsSection.style.display = 'none';
    elements.emptyState.style.display = 'block';
    return;
  }

  elements.resultsSection.style.display = 'block';
  elements.emptyState.style.display = 'none';
  
  updateObjectCount();
  updateCards();
  updateTable();
}

function updateObjectCount() {
  elements.objectCount.textContent = detectedObjects.length;
}

function updateCards() {
  elements.cardsContainer.innerHTML = '';
  
  detectedObjects.forEach((obj, index) => {
    const card = createObjectCard(obj, index);
    elements.cardsContainer.appendChild(card);
  });
}

function createObjectCard(obj, index) {
  const card = document.createElement('div');
  card.className = 'object-card';
  card.style.animationDelay = `${index * 0.1}s`;
  
  const categoryClass = getCategoryClass(obj.category);
  
  card.innerHTML = `
    <img src="${obj.image}" alt="${obj.name}" class="card-image">
    <div class="card-content">
      <h3 class="card-title">${obj.name}</h3>
      <span class="card-category ${categoryClass}">${obj.category}</span>
      <p class="card-description">${obj.description}</p>
      <p class="card-date">${obj.date}</p>
    </div>
  `;
  
  return card;
}

function updateTable() {
  elements.tableBody.innerHTML = '';
  
  detectedObjects.forEach(obj => {
    const row = createTableRow(obj);
    elements.tableBody.appendChild(row);
  });
}

function createTableRow(obj) {
  const row = document.createElement('tr');
  
  const categoryClass = getCategoryClass(obj.category);
  
  row.innerHTML = `
    <td>
      <img src="${obj.image}" alt="${obj.name}" class="table-image">
    </td>
    <td><strong>${obj.name}</strong></td>
    <td>
      <span class="table-category ${categoryClass}">${obj.category}</span>
    </td>
    <td>${obj.description}</td>
    <td>${obj.date}</td>
    <td>
      <div class="table-actions">
        <button class="action-btn edit" onclick="editObject(${obj.id})" title="Editar">
          ✏️ Editar
        </button>
        <button class="action-btn delete" onclick="deleteObject(${obj.id})" title="Eliminar">
          🗑️ Eliminar
        </button>
      </div>
    </td>
  `;
  
  return row;
}

function getCategoryClass(category) {
  const categoryMap = {
    'electrodoméstico': 'category-appliance',
    'mueble': 'category-furniture',
    'utensilio': 'category-utensil',
    'decoración': 'category-decoration',
    'desconocido': 'category-unknown',
    'electrónica': 'category-electronica',
    'cocina': 'category-cocina',
    'limpieza': 'category-limpieza',
    'ropa': 'category-ropa',
    'libro': 'category-libro',
    'juguete': 'category-juguete'
  };
  
  return categoryMap[category.toLowerCase()] || 'category-default';
}

// ===== CRUD FUNCTIONS =====
function editObject(id) {
  const object = detectedObjects.find(obj => obj.id === id);
  if (!object) return;
  
  currentEditingId = id;
  
  // Fill form with object data
  elements.editName.value = object.name;
  elements.editCategory.value = object.category;
  elements.editDescription.value = object.description;
  elements.editDate.value = object.date;
  
  // Show modal
  openEditModal();
}

function deleteObject(id) {
  const object = detectedObjects.find(obj => obj.id === id);
  if (!object) return;
  
  currentDeletingId = id;
  
  // Show delete confirmation modal
  openDeleteModal();
}

function saveEditChanges() {
  if (!currentEditingId) return;
  
  // Get form values
  const name = elements.editName.value.trim();
  const category = elements.editCategory.value.trim();
  const description = elements.editDescription.value.trim();
  
  // Validation
  if (!name || !category || !description) {
    showToast('Por favor completa todos los campos', 'error');
    return;
  }
  
  // Find and update object
  const objectIndex = detectedObjects.findIndex(obj => obj.id === currentEditingId);
  if (objectIndex !== -1) {
    detectedObjects[objectIndex] = {
      ...detectedObjects[objectIndex],
      name,
      category,
      description,
      date: new Date().toLocaleString('es-ES') // Update date to current time
    };
    
    // Update UI and storage
    updateUI();
    saveToLocalStorage();
    closeEditModal();
    showToast('Objeto actualizado correctamente', 'success');
  }
}

function confirmDelete() {
  if (!currentDeletingId) return;
  
  // Remove object from array
  detectedObjects = detectedObjects.filter(obj => obj.id !== currentDeletingId);
  
  // Update UI and storage
  updateUI();
  saveToLocalStorage();
  closeDeleteModal();
  showToast('Objeto eliminado correctamente', 'success');
  
  // Reset current deleting ID
  currentDeletingId = null;
}

// ===== MODAL FUNCTIONS =====
function openEditModal() {
  elements.editModal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  elements.editModal.classList.remove('show');
  document.body.style.overflow = '';
  currentEditingId = null;
  elements.editForm.reset();
}

function openDeleteModal() {
  elements.deleteModal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeDeleteModal() {
  elements.deleteModal.classList.remove('show');
  document.body.style.overflow = '';
  currentDeletingId = null;
}

// ===== KEYBOARD EVENTS FOR MODALS =====
document.addEventListener('keydown', (event) => {
  // Close modals with Escape key
  if (event.key === 'Escape') {
    if (elements.editModal.classList.contains('show')) {
      closeEditModal();
    }
    if (elements.deleteModal.classList.contains('show')) {
      closeDeleteModal();
    }
  }
  
  // Ctrl/Cmd + O para abrir archivo
  if ((event.ctrlKey || event.metaKey) && event.key === 'o') {
    event.preventDefault();
    elements.fileInput.click();
  }
  
  // Ctrl/Cmd + Enter para analizar
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    if (!elements.analyzeBtn.disabled) {
      analyzeImage();
    }
  }
  
  // Ctrl/Cmd + D para cambiar tema
  if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
    event.preventDefault();
    toggleTheme();
  }
  
  // Escape para remover imagen (solo si no hay modales abiertos)
  if (event.key === 'Escape' && currentImage && !elements.editModal.classList.contains('show') && !elements.deleteModal.classList.contains('show')) {
    removeImage();
  }
});

// ===== ESTADOS DE LA INTERFAZ =====
function setAnalyzingState(analyzing) {
  if (analyzing) {
    elements.analyzeBtn.disabled = true;
    elements.btnText.style.display = 'none';
    elements.btnLoader.style.display = 'inline-block';
  } else {
    elements.analyzeBtn.disabled = !currentImage;
    elements.btnText.style.display = 'inline-block';
    elements.btnLoader.style.display = 'none';
  }
}

// ===== MANEJO DEL TEMA =====
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
  
  showToast(`Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`, 'success');
}

function updateThemeIcon(theme) {
  elements.themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===== NOTIFICACIONES TOAST =====
function showToast(message, type = 'info') {
  elements.toastMessage.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.add('show');
  
  setTimeout(() => {
    elements.toast.classList.remove('show');
  }, 3000);
}

// ===== ALMACENAMIENTO LOCAL =====
function saveToLocalStorage() {
  try {
    localStorage.setItem('detectedObjects', JSON.stringify(detectedObjects));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('detectedObjects');
    if (saved) {
      detectedObjects = JSON.parse(saved);
      updateUI();
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    detectedObjects = [];
  }
}

// ===== UTILIDADES =====
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ===== LIMPIEZA DE DATOS =====
function clearAllData() {
  if (confirm('¿Estás seguro de que quieres eliminar todos los datos guardados?')) {
    detectedObjects = [];
    localStorage.removeItem('detectedObjects');
    updateUI();
    showToast('Todos los datos han sido eliminados', 'success');
  }
}

// ===== EXPORTACIÓN DE DATOS =====
function exportData() {
  if (detectedObjects.length === 0) {
    showToast('No hay datos para exportar', 'error');
    return;
  }
  
  const dataStr = JSON.stringify(detectedObjects, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `objetos-detectados-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  showToast('Datos exportados correctamente', 'success');
}

// ===== TECLAS DE ACCESO RÁPIDO =====
// (Esta función fue movida arriba y combinada con los eventos de teclado)

// ===== MANEJO DE ERRORES =====
window.addEventListener('error', (event) => {
  console.error('Error global:', event.error);
  showToast('Ocurrió un error inesperado', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesa rechazada no manejada:', event.reason);
  showToast('Ocurrió un error en la operación', 'error');
});

// ===== DETECCIÓN DE CONEXIÓN =====
window.addEventListener('online', () => {
  showToast('Conexión restaurada', 'success');
});

window.addEventListener('offline', () => {
  showToast('Sin conexión a internet', 'error');
});

// ===== FUNCIONES ADICIONALES PARA MEJORAR LA UX =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Optimizar el rendimiento en dispositivos móviles
const optimizedResize = debounce(() => {
  // Recalcular layouts si es necesario
}, 250);

window.addEventListener('resize', optimizedResize);

// ===== INSTRUCCIONES PARA EL USUARIO =====
console.log('%c🔍 DetectaObjetos - IA para Clasificación de Imágenes', 'font-size: 16px; font-weight: bold; color: #3b82f6;');
console.log('%cAtajos de teclado:', 'font-weight: bold; color: #64748b;');
console.log('%cCtrl/Cmd + O: Abrir archivo', 'color: #94a3b8;');
console.log('%cCtrl/Cmd + Enter: Analizar imagen', 'color: #94a3b8;');
console.log('%cCtrl/Cmd + D: Cambiar tema', 'color: #94a3b8;');
console.log('%cEscape: Cerrar modal o remover imagen', 'color: #94a3b8;');
