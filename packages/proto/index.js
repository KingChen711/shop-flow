const path = require('path');

module.exports = {
  USER_PROTO_PATH: path.join(__dirname, 'user', 'user.proto'),
  PRODUCT_PROTO_PATH: path.join(__dirname, 'product', 'product.proto'),
  ORDER_PROTO_PATH: path.join(__dirname, 'order', 'order.proto'),
  INVENTORY_PROTO_PATH: path.join(__dirname, 'inventory', 'inventory.proto'),
  PAYMENT_PROTO_PATH: path.join(__dirname, 'payment', 'payment.proto'),
};
