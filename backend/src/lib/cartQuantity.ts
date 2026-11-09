export function checkCartQuantity(product: { stock: number; status: string; maxPerCustomer: number }, quantity: number, totalProductQuantity: number, variantStock?: number) {
  if (product.status !== 'ACTIVE') throw Object.assign(new Error('Product is unavailable'), { statusCode: 400 });
  if (quantity > (variantStock ?? product.stock) || totalProductQuantity > product.stock) throw Object.assign(new Error('Requested quantity exceeds available stock'), { statusCode: 400 });
  if (totalProductQuantity > product.maxPerCustomer) throw Object.assign(new Error(`Maximum ${product.maxPerCustomer} per customer for this product`), { statusCode: 400 });
}
