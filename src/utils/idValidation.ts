/**
 * Parse and validate comma-separated IDs from query parameter
 */
export interface IdValidationResult {
  valid: boolean;
  error?: string;
  ids?: string[];
}

export function validateIds(
  ids: string | undefined,
  maxCount: number,
  entityName: string
): IdValidationResult {
  if (!ids) {
    return {
      valid: false,
      error: `ids query parameter is required`,
    };
  }

  // Split comma-separated IDs and validate
  const parsedIds = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (parsedIds.length === 0) {
    return {
      valid: false,
      error: `At least one ${entityName} ID is required`,
    };
  }

  if (parsedIds.length > maxCount) {
    return {
      valid: false,
      error: `Maximum ${maxCount} ${entityName} IDs allowed`,
    };
  }

  return {
    valid: true,
    ids: parsedIds,
  };
}

