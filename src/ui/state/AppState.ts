import { User } from '../../core/domain/entities/User.js';
import { MenuItem } from '../../core/domain/entities/MenuItem.js';
import { Order } from '../../core/domain/entities/Order.js';
import { UserRole } from '../../core/domain/enums/UserRole.js';
import { PaymentMethod } from '../../core/domain/enums/PaymentMethod.js';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export class AppState {
  static currentUser: User = {
    id: 'guest_customer',
    name: 'Comensal en Sala',
    email: 'comensal@restaurante.local',
    role: UserRole.CUSTOMER,
    active: true
  };

  static authenticatedStaffUser: User | null = null;
  static currentLanguage: string = (typeof localStorage !== 'undefined' ? localStorage.getItem('DND_SELECTED_LANG') : null) || 'es';
  static currentAssignedTable: string = 'Mesa 4';
  
  static menuCatalog: MenuItem[] = [];
  static allOrders: Order[] = [];
  static allUsers: User[] = [];
  static currentCart: CartItem[] = [];

  static currentCategoryFilter: string = 'ALL';
  static currentTipPercent: number = 0.10;
  static currentPaymentMethod: PaymentMethod = PaymentMethod.STRIPE_CARD;
  static currentReceiptType: 'TICKET' | 'INVOICE' = 'TICKET';
  static cutleryCount: number = 2;

  static isFilterVegan: boolean = false;
  static isFilterVegetarian: boolean = false;
  static isFilterNoAlcohol: boolean = false;
  static selectedAllergenToExclude: string = 'ALL';
  static currentViewMode: 'compact' | 'grid' = 'compact';
}
