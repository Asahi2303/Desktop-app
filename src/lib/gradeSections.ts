// Central mapping of sections per grade
// Extend this map as more grade-section names are defined
export const gradeSectionsMap: Record<string, string[]> = {
  // 1st Grade
  '1': ['Sampaguita', 'Rose'],
  // 2nd Grade
  '2': ['Tulip', 'Sunflower'],
  // 3rd Grade
  '3': ['Jasmin'],
  // 4th Grade
  '4': ['Gumamela'],
  // 5th Grade
  '5': ['Rosal'],
  // 6th Grade
  '6': ['Santan'],
  // 7th Grade
  '7': ['Rizal'],
  // 8th Grade
  '8': ['Bonifacio'],
  // 9th Grade
  '9': ['Mabini'],
  // 10th Grade
  '10': ['Del Pilar'],
};

export function getSectionsForGrade(grade: string | number | undefined): string[] {
  if (!grade) return [];
  const key = String(grade);
  return gradeSectionsMap[key] || [];
}
