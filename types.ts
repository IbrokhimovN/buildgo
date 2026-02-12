/**
 * BuildGo UI State Types
 * All data types come from services/api.ts (ApiStore, ApiProduct, etc.)
 */

export type ViewState =
  | 'HOME'
  | 'STORE_DETAILS'
  | 'PRODUCT_DETAILS'
  | 'CART'
  | 'SEARCH'
  | 'CHECKOUT'
  | 'PROFILE'
  | 'SELLER'
  | 'ORDER_SUCCESS'
  | 'ORDERS';

export type SellerTabState = 'DASHBOARD' | 'REPORTS' | 'PRODUCTS' | 'ORDERS' | 'SETTINGS';
