
import { Product, AppSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const createProduct = (
  data: Omit<Product, 'id'>
): Product => {
  return {
    ...data,
    id: uuidv4()
  };
};

export const updateStock = (
  product: Product,
  quantityChange: number
): Product => {
  return {
    ...product,
    stock: product.stock + quantityChange
  };
};

export const calculateProfitability = (product: Product) => {
  const cost = product.costUsd || 0;
  const profitRetail = product.priceRetail - cost;
  const profitWholesale = product.priceWholesale - cost;
  const marginRetail = product.priceRetail > 0 ? (profitRetail / product.priceRetail) * 100 : 0;
  const marginWholesale = product.priceWholesale > 0 ? (profitWholesale / product.priceWholesale) * 100 : 0;

  return {
    profitRetail,
    profitWholesale,
    marginRetail,
    marginWholesale
  };
};
