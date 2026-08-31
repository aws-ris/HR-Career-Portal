import COUNTRY_CODES from '../data/countryCodes.json';

export const getCountryFromCode = (codeStr) => {
  if (!codeStr) return 'India';
  const str = String(codeStr).trim();
  const matchParen = str.match(/\(([^)]+)\)/);
  if (matchParen && matchParen[1]) {
    return matchParen[1].trim();
  }
  const cleanCode = str.startsWith('+') ? str : '+' + str;
  const found = COUNTRY_CODES.find(item => item.startsWith(cleanCode + ' ') || item === cleanCode);
  if (found) {
    const match = found.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1].trim();
  }
  return 'India';
};
