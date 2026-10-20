import { MenuCategory } from '../enums/MenuCategory.js';

export interface MenuItemTranslation {
  name: string;
  description: string;
  ingredients?: string[];
  allergens?: string[];
}

export interface ResponsiveImageUrls {
  thumbnail: string; // Mobile compact (e.g. 240x240)
  medium: string;    // Tablet / grid (e.g. 600x380)
  large: string;     // Desktop high-res (e.g. 900x550)
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  requiresCooking: boolean;
  stock: number;
  ingredients?: string[];
  allergens?: string[];
  isVegan?: boolean;
  isVegetarian?: boolean;
  isAlcoholFree?: boolean;
  imageUrl?: string;
  images?: ResponsiveImageUrls;
  translations?: {
    en?: MenuItemTranslation;
    fr?: MenuItemTranslation;
    de?: MenuItemTranslation;
  };
}
