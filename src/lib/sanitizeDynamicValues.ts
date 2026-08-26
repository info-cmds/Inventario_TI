export function sanitizeDynamicValues(
  typeDynamicAttributesJson: string | null | undefined,
  rawDynamicValues: any
): string {
  let parsedRaw: Record<string, any> = {};
  if (typeof rawDynamicValues === 'string') {
    try {
      parsedRaw = JSON.parse(rawDynamicValues || '{}');
    } catch (e) {
      parsedRaw = {};
    }
  } else if (rawDynamicValues && typeof rawDynamicValues === 'object') {
    parsedRaw = { ...rawDynamicValues };
  }

  let attrDefs: { key: string }[] = [];
  try {
    attrDefs = JSON.parse(typeDynamicAttributesJson || '[]');
  } catch (e) {
    attrDefs = [];
  }

  const allowedKeys = new Set(attrDefs.map((a) => a.key));
  const sanitized: Record<string, any> = {};

  Object.entries(parsedRaw).forEach(([key, val]) => {
    // Keep internal system keys starting with '_' AND keys explicitly in dynamic_attributes
    if (key.startsWith('_') || allowedKeys.has(key)) {
      sanitized[key] = val;
    }
  });

  return JSON.stringify(sanitized);
}
