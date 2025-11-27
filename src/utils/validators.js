const MONTH_RANGE = { min: 1, max: 12 };
const YEAR_RANGE = { min: 1900, max: 2100 };
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const validateVocabularyForm = ({
  name,
  meaning,
  sortType,
  month,
  year,
}) => {
  if (!name?.trim()) return 'Vocabulary is required';
  if (!meaning?.trim()) return 'Meaning is required';
  const normalizedSort = sortType?.toUpperCase();
  if (!LETTERS.includes(normalizedSort)) return 'Sort type must be A-Z';

  const monthNumber = Number(month);
  if (
    Number.isNaN(monthNumber) ||
    monthNumber < MONTH_RANGE.min ||
    monthNumber > MONTH_RANGE.max
  ) {
    return 'Month must be between 1 and 12';
  }

  const yearNumber = Number(year);
  if (
    Number.isNaN(yearNumber) ||
    yearNumber < YEAR_RANGE.min ||
    yearNumber > YEAR_RANGE.max
  ) {
    return 'Year must be between 1900 and 2100';
  }

  return null;
};

export const validatePracticeFilters = ({ month, year, limit, sortType }) => {
  // Validate month if provided
  if (month && month !== '') {
    const monthNumber = Number(month);
    if (
      Number.isNaN(monthNumber) ||
      monthNumber < MONTH_RANGE.min ||
      monthNumber > MONTH_RANGE.max
    ) {
      return 'Month filter must be between 1 and 12';
    }
  }

  // Validate year if provided
  if (year && year !== '') {
    const yearNumber = Number(year);
    if (
      Number.isNaN(yearNumber) ||
      yearNumber < YEAR_RANGE.min ||
      yearNumber > YEAR_RANGE.max
    ) {
      return 'Year filter must be between 1900 and 2100';
    }
  }

  // Validate limit - ensure it's a valid number between 1-50
  const limitValue = limit || '5'; // Default to 5 if not provided
  const limitNumber = Number(limitValue);
  if (
    Number.isNaN(limitNumber) ||
    limitNumber < 1 ||
    limitNumber > 50
  ) {
    return 'Range must be between 1 and 50 cards';
  }

  // Validate sortType if provided
  if (sortType && sortType !== '') {
    const sort = sortType.toUpperCase();
    if (!LETTERS.includes(sort)) {
      return 'Sort filter must be A-Z';
    }
  }

  return null;
};

