export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Zone {
  id: string;
  warehouseId: string;
  code: string;
  name: string;
  zoneType: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Location {
  id: string;
  zoneId: string;
  code: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  maxWeight: number;
  maxVolume: number;
  locationType: string;
  isActive: boolean;
  isPickable: boolean;
  barcode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleIds?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
  roleIds?: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  baseUomId: string;
  unitWeight: number;
  unitVolume: number;
  isActive: boolean;
  isTracked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  path: string;
  isActive: boolean;
  children: Category[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductUom {
  id: string;
  productId: string;
  uomCode: string;
  conversionFactor: number;
  isBase: boolean;
  weight: number;
  width: number;
  height: number;
  length: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductBarcode {
  id: string;
  productId: string;
  uomId: string;
  barcode: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDetail extends Product {
  uoms: ProductUom[];
  barcodes: ProductBarcode[];
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  unitWeight?: number;
  unitVolume?: number;
  isTracked?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  categoryId?: string;
  unitWeight?: number;
  unitVolume?: number;
  isActive?: boolean;
  isTracked?: boolean;
}

export interface CreateUomRequest {
  uomCode: string;
  conversionFactor: number;
  isBase?: boolean;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
}

export interface CreateBarcodeRequest {
  barcode: string;
  uomId?: string;
  isPrimary?: boolean;
}

export interface CreateCategoryRequest {
  code: string;
  name: string;
  parentId?: string;
}

export interface UpdateCategoryRequest {
  code?: string;
  name?: string;
}

export interface ReceivingOrderLine {
  id: string;
  receivingOrderId: string;
  productId: string;
  productName: string;
  productSku: string;
  expectedQuantity: number;
  receivedQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReceivingOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  status: string;
  notes: string;
  lines: ReceivingOrderLine[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReceivingOrderRequest {
  supplier: string;
  notes?: string;
  lines: { productId: string; expectedQuantity: number }[];
}

export interface UpdateReceivingOrderRequest {
  supplier?: string;
  notes?: string;
}

export interface ReceiveItemRequest {
  lineId: string;
  receivedQuantity: number;
}

export interface ReceiveItemsRequest {
  items: ReceiveItemRequest[];
}
