export interface BlogCategoryGroup {
  label: string;
  values: string[];
}

export const BLOG_TAXONOMY: BlogCategoryGroup[] = [
  { label: "Graphic Design", values: ["Graphic Design", "Graphic Design > Canva", "Graphic Design > Adobe CC"] },
  { label: "Marketing", values: ["Marketing", "Marketing > Social Media", "Marketing > Email"] },
  { label: "Websites", values: ["Websites"] },
  { label: "Productivity", values: ["Productivity"] },
  { label: "Business", values: ["Business", "Business > Client Management", "Business > Project Management"] },
  { label: "HipTips", values: ["HipTips"] },
  { label: "Toolbox", values: ["Toolbox"] },
  { label: "AI", values: ["AI"] },
];

export const BLOG_CATEGORY_DEFAULT = "Graphic Design";
