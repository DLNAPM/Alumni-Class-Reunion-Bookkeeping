/**
 * Name parsing, normalization, and formatting utilities
 * to support standardized "Last, First" format and intelligent classmate matching.
 */

/**
 * Converts a name string to "Last, First" format.
 * Examples:
 *   "John Smith" -> "Smith, John"
 *   "Mary Jane Watson" -> "Watson, Mary Jane"
 *   "Smith, John" -> "Smith, John"
 *   "David" -> "David"
 */
export const formatToLastFirst = (name: string): string => {
  if (!name) return '';
  const trimmed = name.trim().replace(/\s+/g, ' ');

  // If already contains a comma, normalize whitespace around comma
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts.slice(1).join(' ')}`;
    }
    return parts[0] || '';
  }

  // Split by space
  const parts = trimmed.split(' ');
  if (parts.length === 1) {
    return parts[0];
  }

  // Last token is last name, preceding tokens are first/middle names
  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, parts.length - 1).join(' ');
  return `${lastName}, ${firstNames}`;
};

/**
 * Normalizes a name into lowercase alphanumeric tokens.
 */
export const normalizeNameTokens = (name?: string): string[] => {
  if (!name) return [];
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 0);
};

/**
 * Checks whether two names match (e.g. "Smith, John" and "John Smith", "David Miller" and "Miller, David").
 */
export const isNameMatch = (nameA?: string, nameB?: string): boolean => {
  if (!nameA || !nameB) return false;

  const rawA = nameA.trim().toLowerCase();
  const rawB = nameB.trim().toLowerCase();
  if (rawA === rawB) return true;

  const tokensA = normalizeNameTokens(nameA);
  const tokensB = normalizeNameTokens(nameB);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Exact set match (regardless of order)
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  if (tokensA.length === tokensB.length && tokensA.every(t => setB.has(t))) {
    return true;
  }

  // Check if all tokens of smaller name are in larger name (e.g. "John Smith" in "John Robert Smith")
  const allAinB = tokensA.every(t => setB.has(t));
  const allBinA = tokensB.every(t => setA.has(t));
  if (allAinB || allBinA) {
    return true;
  }

  // Check last name match with first initial or first name match
  if (tokensA.length >= 2 && tokensB.length >= 2) {
    const lastA = tokensA[0].length > tokensA[tokensA.length - 1].length ? tokensA[0] : tokensA[tokensA.length - 1];
    const lastB = tokensB[0].length > tokensB[tokensB.length - 1].length ? tokensB[0] : tokensB[tokensB.length - 1];
    if (lastA === lastB) {
      // Last names match, check if any first name tokens overlap or start with same letter
      const firstA = tokensA.filter(t => t !== lastA);
      const firstB = tokensB.filter(t => t !== lastB);
      if (firstA.some(fa => firstB.some(fb => fa === fb || fa.startsWith(fb) || fb.startsWith(fa)))) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Derives a candidate display name from an email address (e.g. "john.smith@domain.com" -> "Smith, John").
 */
export const deriveNameFromEmail = (email?: string): string => {
  if (!email) return '';
  const prefix = email.split('@')[0] || '';
  const clean = prefix.replace(/[0-9._-]+/g, ' ').trim();
  if (!clean) return '';
  const capitalized = clean
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return formatToLastFirst(capitalized);
};
