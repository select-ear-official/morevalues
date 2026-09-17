import LZString from 'lz-string';

/**
 * Encodes a test object into a compressed URL hash payload.
 */
export function encodeTestToUrlHash(test) {
  try {
    const jsonStr = JSON.stringify(test);
    return LZString.compressToEncodedURIComponent(jsonStr);
  } catch (err) {
    console.error("Error compressing test to hash:", err);
    return null;
  }
}

/**
 * Decodes a test object from a compressed URL hash payload.
 */
export function decodeTestFromUrlHash(hashString) {
  try {
    if (!hashString) return null;
    const cleanHash = hashString.startsWith('#') ? hashString.substring(1) : hashString;
    const param = new URLSearchParams(cleanHash).get('test') || cleanHash;
    const decompressed = LZString.decompressFromEncodedURIComponent(param);
    if (!decompressed) return null;
    return JSON.parse(decompressed);
  } catch (err) {
    console.error("Error decompressing test from hash:", err);
    return null;
  }
}

/**
 * Downloads a test object as a local `.8val.json` file.
 */
export function downloadTestJson(test, filename = `${test.id || 'custom-test'}.8val.json`) {
  const jsonString = JSON.stringify(test, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

/**
 * Reads a uploaded JSON file into a JavaScript Test object.
 */
export function parseTestJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed.title || !Array.isArray(parsed.axes) || !Array.isArray(parsed.questions)) {
          throw new Error("Invalid .8val.json format: Missing title, axes, or questions array.");
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
