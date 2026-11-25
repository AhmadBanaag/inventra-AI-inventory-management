async function extractInventory(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await fetch('/api/ai/extract', {
    method: 'POST',
    body: formData,
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result && result.error && result.error.message
      ? result.error.message
      : 'The image could not be processed. Please try again.');
  }

  if (!result || result.success !== true || !result.data) {
    throw new Error('The server returned an invalid extraction response.');
  }

  return result.data;
}

window.InventraApi = { extractInventory };