/**
 * Utilities for handling forms with JSON data and files
 * Supports nested objects, arrays, and File objects
 */

/**
 * Build FormData from an object with nested structures and files
 *
 * @example
 * const data = {
 *   name: "My Kit",
 *   colors: { bg: "#fff", text: "#000" },
 *   pads: [
 *     { name: "Kick", samples: [file1, "url1"] },
 *     { name: "Snare", samples: [file2] }
 *   ]
 * };
 * const formData = buildFormDataWithFiles(data);
 */
export function buildFormDataWithFiles(data: Record<string, any>): FormData {
  const formData = new FormData();

  function appendValue(key: string, value: any) {
    if (value === null || value === undefined) {
      return;
    }

    // Handle File objects
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    // Handle primitives
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      formData.append(key, String(value));
      return;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        appendValue(`${key}_${index}`, item);
      });
      return;
    }

    // Handle nested objects
    if (typeof value === "object") {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        appendValue(`${key}_${nestedKey}`, nestedValue);
      });
      return;
    }
  }

  Object.entries(data).forEach(([key, value]) => {
    appendValue(key, value);
  });

  return formData;
}

/**
 * Parse FormData back into an object with nested structures
 * Reconstructs arrays and nested objects based on naming pattern (key_index_field)
 *
 * @example
 * const formData = await request.formData();
 * const data = parseFormDataWithFiles(formData);
 * // Returns: { name: "My Kit", colors: {...}, pads: [{...}] }
 */
export function parseFormDataWithFiles(formData: FormData): Record<string, any> {
  const result: Record<string, any> = {};
  const arrayMaps = new Map<string, Map<number, any>>();
  const nestedObjects = new Map<string, Record<string, any>>();

  // Debug: Log all form data entries
  console.log("FormData entries:");
  for (const [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
  }

  // First pass: collect all nested object fields
  for (const [key, value] of formData.entries()) {
    const nestedMatch = key.match(/^(.+?)_(.+)$/);

    if (nestedMatch && !key.includes("_url")) {
      const [, objectKey, field] = nestedMatch;

      // Handle known nested objects
      if (objectKey === "about" || objectKey === "colors") {
        console.log(`Processing nested: ${objectKey}.${field} =`, value);
        if (!nestedObjects.has(objectKey)) {
          nestedObjects.set(objectKey, {});
        }
        nestedObjects.get(objectKey)![field] = value;
        continue;
      }
    }
  }

  // Second pass: process everything else
  for (const [key, value] of formData.entries()) {
    // Skip if it's a nested object field we already handled
    const nestedMatch = key.match(/^(.+?)_(.+)$/);
    if (nestedMatch && !key.includes("_url")) {
      const [, objectKey] = nestedMatch;
      if (objectKey === "about" || objectKey === "colors") {
        console.log(`Skipping already handled: ${key}`);
        continue; // Skip, already handled
      }
    }

    // Check if it's an array item (key_index_field or key_index)
    const arrayMatch = key.match(/^(.+?)_(\d+)(?:_(.+))?$/);

    if (arrayMatch) {
      const [, arrayKey, indexStr, field] = arrayMatch;
      const index = parseInt(indexStr);

      // Initialize array map if needed
      if (!arrayMaps.has(arrayKey)) {
        arrayMaps.set(arrayKey, new Map());
      }
      const arrayMap = arrayMaps.get(arrayKey)!;

      // Initialize item if needed
      if (!arrayMap.has(index)) {
        arrayMap.set(index, {});
      }

      if (field) {
        // Nested field in array item (e.g., pad_0_name)
        const item = arrayMap.get(index)!;

        // Check for further nesting (e.g., pad_0_sample_1)
        const nestedMatch = field.match(/^(.+?)_(\d+)$/);
        if (nestedMatch) {
          const [, nestedKey, nestedIndexStr] = nestedMatch;
          const nestedIndex = parseInt(nestedIndexStr);

          if (!item[nestedKey]) {
            item[nestedKey] = [];
          }
          item[nestedKey][nestedIndex] = value;
        } else {
          item[field] = value;
        }
      } else {
        // Direct array item (e.g., tags_0)
        arrayMap.set(index, value);
      }
    } else {
      // Simple field
      console.log(`Adding simple field: ${key} =`, value);
      result[key] = value;
    }
  }

  // Convert array maps to arrays
  arrayMaps.forEach((arrayMap, arrayKey) => {
    const items = Array.from(arrayMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([, value]) => value);
    result[arrayKey] = items;
  });

  // Add nested objects to result
  console.log("Nested objects to add:");
  nestedObjects.forEach((obj, key) => {
    console.log(`  ${key}:`, obj);
    result[key] = obj;
  });

  console.log("Final result:", result);
  return result;
}
