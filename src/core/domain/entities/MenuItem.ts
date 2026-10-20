import { MenuCategory } from '../enums/MenuCategory.js';

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
  imageUrl?: string;
}
