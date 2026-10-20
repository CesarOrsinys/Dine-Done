import { MenuCategory } from '../enums/MenuCategory.js';

export interface MenuItemTranslation {
  name: string;
  description: string;
  ingredients?: string[];
  allergens?: string[];
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
  translations?: {
    en?: MenuItemTranslation;
    fr?: MenuItemTranslation;
    de?: MenuItemTranslation;
  };
}
