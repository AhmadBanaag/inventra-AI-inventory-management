/**
 * INVENTRA SCAN INVENTORY CONTROLLER (scan-inventory.js)
 */

let selectedFile = null;

document.addEventListener('DOMContentLoaded', () => {
  renderSidebar('scan');
  renderNavbar('Scan Inventory');

  setupUploadHandlers();
  setupGuidelinesModal();
});

function setupUploadHandlers() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('sheet-file-input');
  const previewBox = document.getElementById('preview-box');
  const previewImg = document.getElementById('preview-img');
  const previewFilename = document.getElementById('preview-filename');
  const clearBtn = document.getElementById('clear-file-btn');
  const processBtn = document.getElementById('process-btn');
  const form = document.getElementById('upload-form');

  if (!dropzone || !fileInput) return;

  // Clicking the dropzone opens the guidelines modal first (if no file selected)
  dropzone.addEventListener('click', () => {
    if (!selectedFile) {
      openGuidelinesModal();
    } else {
      fileInput.click();
    }
  });

  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!selectedFile) {
        openGuidelinesModal();
      } else {
        fileInput.click();
      }
    }
  });

  // Drag & drop listeners
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelected(files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFileSelected(fileInput.files[0]);
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      selectedFile = null;
      fileInput.value = '';
      if (previewBox) previewBox.style.display = 'none';
      if (processBtn) processBtn.disabled = true;
    });
  }

  if (form) {
    form.addEventListener('submit', handleUploadSubmit);
  }
}

/* ── Photo Guidelines Modal ── */
function setupGuidelinesModal() {
  const modal = document.getElementById('guidelines-modal');
  const closeBtn = document.getElementById('guidelines-modal-close');
  if (!modal) return;

  // Continue button
  const continueBtn = document.getElementById('guidelines-continue-btn');
  if (continueBtn) {
    continueBtn.addEventListener('click', () => closeGuidelinesModal());
  }

  // Close on X button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeGuidelinesModal());
  }

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeGuidelinesModal();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeGuidelinesModal();
    }
  });
}

function openGuidelinesModal() {
  const modal = document.getElementById('guidelines-modal');
  if (modal) {
    modal.classList.add('active');
    // After the user reads guidelines, they can close and pick a file
    const fileInput = document.getElementById('sheet-file-input');
    // Add a one-time listener so after modal closes, the file picker opens
    const handler = () => {
      if (fileInput) fileInput.click();
      modal.removeEventListener('modal-closed', handler);
    };
    modal.addEventListener('modal-closed', handler);
  }
}

function closeGuidelinesModal() {
  const modal = document.getElementById('guidelines-modal');
  if (modal) {
    modal.classList.remove('active');
    // Dispatch custom event so the file picker opens
    modal.dispatchEvent(new CustomEvent('modal-closed'));
  }
}

function handleFileSelected(file) {
  if (!file.type.startsWith('image/')) {
    notify.error('Please upload an image file (JPG, PNG, or WEBP).');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    notify.error('File size exceeds the 10MB limit.');
    return;
  }

  selectedFile = file;

  const previewBox = document.getElementById('preview-box');
  const previewImg = document.getElementById('preview-img');
  const previewFilename = document.getElementById('preview-filename');
  const processBtn = document.getElementById('process-btn');

  if (previewImg) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  if (previewFilename) {
    previewFilename.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  }

  if (previewBox) previewBox.style.display = 'block';
  if (processBtn) processBtn.disabled = false;
}

async function handleUploadSubmit(e) {
  e.preventDefault();
  if (!selectedFile) return;

  const processBtn = document.getElementById('process-btn');
  if (processBtn) {
    processBtn.disabled = true;
    processBtn.textContent = 'Uploading Sheet...';
  }

  const formData = new FormData();
  formData.append('sheetImage', selectedFile);

  try {
    const res = await api.upload('/scan/upload', formData);
    const scanId = res.scanId || res.id;
    notify.success('Sheet uploaded. Starting AI handwriting recognition...');
    
    // Redirect to dedicated AI processing transition screen
    setTimeout(() => {
      window.location.href = `/pages/ai-processing.html?scanId=${scanId}`;
    }, 600);
  } catch (err) {
    notify.error(`Upload failed: ${err.message}`);
    if (processBtn) {
      processBtn.disabled = false;
      processBtn.textContent = 'Process with Gemini AI';
    }
  }
}
