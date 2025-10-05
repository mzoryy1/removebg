// NOTE: For a real-world Android app, this API key MUST be stored on a secure backend server.
// Storing it in client-side code is INSECURE and only done here for the Codepen example.
const REMOVE_BG_API_KEY = 'P61GTYVnBgZ1UVeVKUqT9WCS';
const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';
const MAX_FILE_COUNT = 5;

// DOM Elements
const splashScreen = document.getElementById('splash-screen');
const appContainer = document.querySelector('.app-container');
const imageUpload = document.getElementById('image-upload');
const fileLabel = document.getElementById('file-label');
const fileCountDisplay = document.getElementById('file-count-display');
const removeBgBtn = document.getElementById('remove-bg-btn');
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const currentFileNameEl = document.getElementById('current-file-name');
const errorMessageEl = document.getElementById('error-message');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const downloadAllBtn = document.getElementById('download-all-btn');
const resultsDisplay = document.getElementById('results-display');

let processedImages = [];
let filesToProcess = [];
let isProcessing = false;

// ------------------- Utility Functions -------------------

function updateHistoryUI() {
  historyList.innerHTML = '';
  
  if (processedImages.length === 0) {
    historyList.innerHTML = '<p class="empty-message">No images processed yet.</p>';
    clearHistoryBtn.disabled = true;
    downloadAllBtn.disabled = true;
    return;
  }

  processedImages.forEach((item) => {
    const itemEl = document.createElement('div');
    itemEl.classList.add('history-item');
    
    const img = new Image();
    img.src = item.url;
    
    const details = document.createElement('div');
    details.classList.add('history-item-details');
    details.innerHTML = `<p class="filename">${item.name}</p><p>Completed</p>`;
    
    const downloadBtn = document.createElement('button');
    downloadBtn.classList.add('download-single-btn');
    downloadBtn.textContent = 'Download';
    downloadBtn.onclick = () => downloadSingleImage(item.url, item.name);

    itemEl.appendChild(img);
    itemEl.appendChild(details);
    itemEl.appendChild(downloadBtn);
    historyList.appendChild(itemEl);
  });
  
  clearHistoryBtn.disabled = false;
  downloadAllBtn.disabled = false;
}

function updateUploadUI() {
  const count = filesToProcess.length;
  fileCountDisplay.textContent = count > 0 ? `${count} file${count > 1 ? 's' : ''} ready.` : '';
  removeBgBtn.disabled = count === 0 || isProcessing;
}

function setProcessingState(processing) {
  isProcessing = processing;
  removeBgBtn.disabled = processing || filesToProcess.length === 0;
  removeBgBtn.textContent = processing ? 'Processing...' : 'Remove Background';
  progressContainer.classList.toggle('hidden', !processing);
}

function updateProgress(fileName, index, total) {
  const percentage = total > 0 ? Math.round((index / total) * 100) : 0;
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}% Complete (${index}/${total} images)`;
  currentFileNameEl.textContent = `Processing: ${fileName}`;
}

function showError(message) {
  errorMessageEl.textContent = message;
  errorMessageEl.classList.remove('hidden');
  setTimeout(() => errorMessageEl.classList.add('hidden'), 5000);
}

/**
 * Creates an image element and adds it to the main results grid.
 * @param {string} url - The URL (Data URL or Blob URL) of the result image.
 * @param {string} name - The original file name.
 */
function displayResult(url, name) {
  // Remove the "empty message" if it exists
  const emptyMsg = resultsDisplay.querySelector('.empty-message');
  if (emptyMsg) emptyMsg.remove();
  
  const card = document.createElement('div');
  card.classList.add('result-card');
  
  const imgContainer = document.createElement('div');
  imgContainer.classList.add('result-image-container');
  
  const img = new Image();
  img.src = url;
  
  imgContainer.appendChild(img);
  
  const title = document.createElement('p');
  title.textContent = name;
  title.style.fontSize = '0.9em';
  title.style.fontWeight = '600';

  const downloadBtn = document.createElement('button');
  downloadBtn.classList.add('download-single-btn');
  downloadBtn.textContent = 'Download PNG';
  downloadBtn.onclick = () => downloadSingleImage(url, name);
  
  card.appendChild(imgContainer);
  card.appendChild(title);
  card.appendChild(downloadBtn);
  resultsDisplay.prepend(card); // Add newest at the top
}


/**
 * Sends a file to the remove.bg API.
 * @param {File} file 
 * @returns {Promise<string>} - A promise that resolves to the result image Data URL.
 */
async function removeBackground(file) {
  const formData = new FormData();
  formData.append('image_file', file);
  formData.append('size', 'auto');
  formData.append('format', 'png');

  try {
    const response = await fetch(REMOVE_BG_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
        'Accept': 'image/png'
      },
      body: formData,
    });

    if (response.ok) {
      const blob = await response.blob();
      // Convert Blob to Data URL for easy storage/use in the client-side app
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
      });
    } else {
      const errorText = await response.text();
      let msg = `API Error: ${response.status}`;
      try {
        const json = JSON.parse(errorText);
        msg = json.errors ? json.errors[0].title : msg;
      } catch (e) {
        // Fallback
      }
      throw new Error(msg);
    }

  } catch (error) {
    console.error('Fetch error:', error);
    throw new Error(error.message || 'Network error or file processing failed.');
  }
}

/**
 * Main function to process all uploaded files.
 */
async function processAllFiles() {
  if (isProcessing || filesToProcess.length === 0) return;

  setProcessingState(true);
  let errorOccurred = false;
  const totalFiles = filesToProcess.length;

  for (let i = 0; i < totalFiles; i++) {
    const file = filesToProcess[i];
    const originalName = file.name.replace(/\.[^/.]+$/, "");
    const newFileName = `${originalName}-no-bg.png`;

    updateProgress(file.name, i + 1, totalFiles);
    
    try {
      // resultUrl is a Data URL
      const resultUrl = await removeBackground(file); 
      
      processedImages.push({
        url: resultUrl,
        name: newFileName,
        originalFile: file
      });
      
      displayResult(resultUrl, newFileName);
      updateHistoryUI();
      
    } catch (error) {
      showError(`Failed to process ${file.name}: ${error.message}`);
      errorOccurred = true;
    }
  }

  // Final cleanup
  filesToProcess = [];
  imageUpload.value = null;
  setProcessingState(false);
  
  if (!errorOccurred) {
      updateProgress('All files processed!', totalFiles, totalFiles);
      setTimeout(() => progressContainer.classList.add('hidden'), 2000);
  }
  updateUploadUI(); // Ensure button is disabled
}

// ------------------- Download and History Management -------------------

/**
 * Handles the download of a single image (Data URL).
 * @param {string} url - Data URL of the image.
 * @param {string} name - The filename.
 */
function downloadSingleImage(url, name) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads all processed images as a ZIP file. (Requires JSZip library)
 */
async function downloadAllAsZip() {
  if (processedImages.length === 0) return;
  
  downloadAllBtn.textContent = 'Creating ZIP...';
  downloadAllBtn.disabled = true;

  if (typeof JSZip === 'undefined') {
    showError('JSZip library is missing. Please add it to your project!');
    downloadAllBtn.textContent = 'Download All (ZIP)';
    downloadAllBtn.disabled = false;
    return;
  }
  
  const zip = new JSZip();

  for (const item of processedImages) {
    // Extract base64 data from the Data URL
    const base64Data = item.url.split(',')[1];
    zip.file(item.name, base64Data, {base64: true});
  }

  zip.generateAsync({ type: 'blob' })
    .then(content => {
      const zipName = `background-removed-${Date.now()}.zip`;
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup Blob URL after use
      URL.revokeObjectURL(link.href);
      
      downloadAllBtn.textContent = 'Download All (ZIP)';
      downloadAllBtn.disabled = false;
    })
    .catch(error => {
      showError('Failed to create ZIP file.');
      console.error(error);
      downloadAllBtn.textContent = 'Download All (ZIP)';
      downloadAllBtn.disabled = false;
    });
}

function clearHistory() {
  if (!confirm('Are you sure you want to clear all history and processed images?')) return;
  processedImages = [];
  resultsDisplay.innerHTML = '<p class="empty-message">Processed images will appear here.</p>';
  updateHistoryUI();
}

// ------------------- Event Listeners -------------------

// 1. Splash Screen Timeout
window.addEventListener('load', () => {
  setTimeout(() => {
    splashScreen.style.opacity = '0';
    appContainer.classList.remove('hidden');
    setTimeout(() => {
      splashScreen.style.display = 'none';
    }, 800); 
  }, 1000);
});

// 2. File Input Change
imageUpload.addEventListener('change', (e) => {
  const newFiles = Array.from(e.target.files);
  if (newFiles.length > MAX_FILE_COUNT) {
    showError(`Max ${MAX_FILE_COUNT} files allowed.`);
    imageUpload.value = null;
    filesToProcess = [];
  } else {
    filesToProcess = newFiles;
  }
  updateUploadUI();
});

// 3. Remove Background Button Click
removeBgBtn.addEventListener('click', processAllFiles);

// 4. History Actions
clearHistoryBtn.addEventListener('click', clearHistory);
downloadAllBtn.addEventListener('click', downloadAllAsZip);

// 5. Drag and Drop handlers 
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  fileLabel.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
  fileLabel.addEventListener(eventName, () => fileLabel.style.backgroundColor = 'rgba(0, 188, 212, 0.1)', false);
});

['dragleave', 'drop'].forEach(eventName => {
  fileLabel.addEventListener(eventName, () => fileLabel.style.backgroundColor = 'transparent', false);
});

fileLabel.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  
  if (files.length > MAX_FILE_COUNT) {
    showError(`Maximum ${MAX_FILE_COUNT} files allowed.`);
  } else {
    imageUpload.files = files;
    filesToProcess = Array.from(files);
    updateUploadUI();
  }
}, false);

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Initial state setup
updateHistoryUI();
