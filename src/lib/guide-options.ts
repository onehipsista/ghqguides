export const GUIDE_CATEGORY_OPTIONS = [
  "Graphic Design",
  "Marketing",
  "Social Media",
  "Email Marketing",
  "Websites",
  "Canva",
] as const;

export const GUIDE_AUDIENCE_OPTIONS = [
  "Small Businesses",
  "Graphic Designers",
  "Nonprofits",
  "Entrepreneurs",
] as const;

export const GUIDE_LEVEL_OPTIONS = [
  "All Levels",
  "Foundational",
  "Working Knowledge",
  "Advanced",
  "Technical",
] as const;

export const estimateReadingTimeMinutes = (content: string): number => {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 1;
  return Math.max(1, Math.ceil(words / 200));
};
