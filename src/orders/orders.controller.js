const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function validateOrder(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  const requiredFields = ["deliverTo", "mobileNumber", "dishes"];
  for (const field of requiredFields) {
    if (!req.body.data || !req.body.data[field]) {
      return next({
        status: 400,
        message: `Order must include a ${field}`,
      });
    }
  }

  if (!Array.isArray(dishes) || dishes.length === 0) {
    return next({
      status: 400,
      message: "Order must include at least one dish",
    });
  }

  for (let i = 0; i < dishes.length; i++) {
    const { quantity } = dishes[i];
    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${i} must have a quantity that is a number greater than 0`,
      });
    }
  }

  next();
}

function validateOrderId(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  }

  res.locals.order = foundOrder;
  next();
}

function validateStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatuses = ['pending', 'preparing', 'out-for-delivery', 'delivered'];

  if (!status || typeof status !== 'string' || !validStatuses.includes(status)) {
    return next({
      status: 400,
      message: 'Order must have a status of pending, preparing, out-for-delivery, or delivered',
    });
  }

  next();
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  for (const dish of dishes) {
    if (
      !dish.quantity ||
      typeof dish.quantity !== "number" ||
      dish.quantity <= 0
    ) {
      return next({
        status: 400,
        message: `Dish ${dishes.indexOf(dish)} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function list(req, res, next) {
  res.json({ data: orders });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { id, deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  if (id && id !== order.id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${order.id}`,
    });
  }

  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  res.json({ data: order });
}

function destroy(req, res) {
  const { orderId } = req.params;

  // Find the order index in the orders array
  const index = orders.findIndex((order) => order.id === orderId);

  if (index === -1) {
    // If the order with the given ID is not found, return a 404 response
    return res.status(404).json({ error: `Order with ID ${orderId} not found.` });
  }

  const order = orders[index];

  if (order.status !== "pending") {
    // If the order status is not "pending," it cannot be deleted, so return a 400 response
    return res.status(400).json({
      error: "An order cannot be deleted unless it is in 'pending' status.",
    });
  }

  // Remove the order from the orders array
  orders.splice(index, 1);

  // Respond with a 204 status code (no content) to indicate successful deletion
  res.sendStatus(204);
}

module.exports = {
  create: [validateOrder, create],
  destroy,
  list,
  read: [validateOrderId, read],
  update: [validateOrderId, validateOrder, validateStatus, update],
};