import { MenuItem } from '../domain/entities/MenuItem.js';
import { IMenuRepository } from '../ports/IMenuRepository.js';

export class ManageStockUseCase {
  constructor(private readonly menuRepo: IMenuRepository) {}

  async execute(menuItemId: string, newStock: number): Promise<MenuItem> {
    if (newStock < 0) {
      throw new Error('El stock no puede ser un valor negativo.');
    }
    return await this.menuRepo.updateStock(menuItemId, newStock);
  }
}
