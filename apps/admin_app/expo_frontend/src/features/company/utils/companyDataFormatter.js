/**
 * Formats company data for the CompanyPageScreen.
 * Handles normalization of flat admin data and fixes known data issues (e.g. template fallback).
 * 
 * @param {Object} companyData - The raw company data fetched from Firestore
 * @returns {Object} - The formatted data ready for the UI
 */
export const formatCompanyData = (companyData) => {
  if (!companyData) return {};

  // Create a copy to avoid mutation
  const data = { ...companyData };

  // FIX: Handle case where data has both flat fields (correct) and nested template data (incorrect)
  // This specifically addresses the issue where 'ヤヲー株式会社' (template) is shown instead of the correct company name
  const flatName = data.companyName || data.name;
  if (flatName && data['会社概要']?.['社名'] === 'ヤヲー株式会社') {
    const currentProfile = data['会社概要'] ?? {};
    /** @type {Object.<string, any>} */
    data['会社概要'] = {
      ...currentProfile,
      '社名': flatName
    };
  }

  // Check if data is already nested (has '会社概要')
  if (data['会社概要'] ?? null) {
    return data;
  }

  // Determine company name using same logic as list view
  const companyName = data.companyName || data.name || '名称未設定';

  // Map flat data to nested structure
  return {
    '会社概要': {
      '社名': companyName,
      '事業内容': data.businessContent || data.description || '事業内容が設定されていません。',
      '住所': data.address || '',
      '背景画像URL': data.backgroundUrl || data.backgroundImage,
      'ロゴ画像URL': data.logoUrl || data.logo,
      '設立': data.establishmentDate,
      '従業員数': data.employeeCount,
      '本社所在地': data.address,
      'URL': data.website,
    },
    '魅力/特徴': data.features ?? data['魅力/特徴'] ?? {},
    '使用技術': data.tech_stack ?? {},
    // Preserve other top-level fields
    ...data
  };
};
