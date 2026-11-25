const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

let selectedFile = null;
let previewUrl = null;

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('Scan Inventory');
  renderSidebar('scan');
  setupUploadHandlers();
  setupGuidelinesModal();
});

function setupUploadHandlers() {
  const dropzone = document.querySelector('#dropzone');
  const fileInput = document.querySelector('#sheet-file-input');
  const form = document.querySelector('#upload-form');
  const clearButton = document.querySelector('#clear-file-btn');

  dropzone.addEventListener('click', () => openGuidelinesModal());
  dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openGuidelinesModal();
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (event) => {
    const [file] = event.dataTransfer.files;
    if (file) handleFileSelected(file);
  });

  fileInput.addEventListener('change', () => {
    const [file] = fileInput.files;
    if (file) handleFileSelected(file);
  });

  clearButton.addEventListener('click', clearSelectedFile);
  form.addEventListener('submit', handleUploadSubmit);
}

function setupGuidelinesModal() {
  const modal = document.querySelector('#guidelines-modal');
  const closeButton = document.querySelector('#guidelines-modal-close');
  const continueButton = document.querySelector('#guidelines-continue-btn');

  closeButton.addEventListener('click', closeGuidelinesModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeGuidelinesModal();
  });

  continueButton.addEventListener('click', () => {
    closeGuidelinesModal();
    document.querySelector('#sheet-file-input').click();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) closeGuidelinesModal();
  });
}

function openGuidelinesModal() {
  const modal = document.querySelector('#guidelines-modal');
  modal.hidden = false;
  modal.classList.add('active');
  document.querySelector('#guidelines-continue-btn').focus();
}

function closeGuidelinesModal() {
  const modal = document.querySelector('#guidelines-modal');
  modal.classList.remove('active');
  modal.hidden = true;
  document.querySelector('#dropzone').focus();
}

function handleFileSelected(file) {
  if (!ALLOWED_TYPES.has(file.type)) {
    showError('Upload a JPEG, PNG, or WebP image.');
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    showError('The image must be 8 MB or smaller.');
    return;
  }

  selectedFile = file;
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);

  document.querySelector('#preview-img').src = previewUrl;
  document.querySelector('#preview-filename').textContent =
    `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  document.querySelector('#preview-box').hidden = false;
  document.querySelector('#process-btn').disabled = false;
  clearStatus();
}

function clearSelectedFile() {
  selectedFile = null;
  document.querySelector('#sheet-file-input').value = '';
  document.querySelector('#preview-img').removeAttribute('src');
  document.querySelector('#preview-box').hidden = true;
  document.querySelector('#process-btn').disabled = true;

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  clearStatus();
}

async function handleUploadSubmit(event) {
  event.preventDefault();
  if (!selectedFile) return;

  const processButton = document.querySelector('#process-btn');
  processButton.disabled = true;
  processButton.textContent = 'Analyzing image...';
  clearStatus();

  try {
    const data = await window.InventraApi.extractInventory(selectedFile);
    sessionStorage.setItem('inventra-scan-results', JSON.stringify(data));
    window.location.href = '/pages/scan-results.html';
  } catch (error) {
    showError(error.message);
    processButton.disabled = false;
    processButton.textContent = 'Try extraction again';
  }
}

function showError(message) {
  const status = document.querySelector('#status');
  status.textContent = message;
  status.classList.add('is-error');
  if (window.notify) window.notify.error(message);
}

function clearStatus() {
  const status = document.querySelector('#status');
  status.textContent = '';
  status.classList.remove('is-error');
}
