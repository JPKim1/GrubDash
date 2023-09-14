const path = require("path");

const dishes = require(path.resolve("src/data/dishes-data"));

const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
function isValidDishId(dishId) {
  return dishes.some((dish) => dish.id === dishId);
}

function validateDish(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;

  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields) {
    if (!req.body.data || !req.body.data[field]) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  }

  if (typeof price !== "number" || price <= 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0",
    });
  }

  next();
}

function validateDishId(req, res, next) {
  const { dishId } = req.params;

  // Look up the dish using the dishId and set it in res.locals.dish
  const dish = dishes.find((dish) => dish.id === dishId);

  if (!dish) {
    return next({
      status: 404,
      message: `Dish not found: ${dishId}`,
    });
  }

  res.locals.dish = dish;
  next();
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function list(req, res, next) {
  res.json({ data: dishes });
}

function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res, next) {
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const dish = res.locals.dish;
  const { dishId } = req.params;

  // Validate the dish ID in the request body
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }

  // Add validation for other fields
  if (!name || name === "") {
    return next({
      status: 404,
      message: "Dish must include a name",
    });
  }

  // Update the dish properties
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  res.json({ data: dish });
}

module.exports = {
  create: [validateDish, create],
  list,
  read: [validateDishId, read],
  update: [validateDishId, validateDish, update],
};