const database = require("../Services/database");

exports.getAllProducts = async (req, res) => {
  try {
    const result = await database.pool.query(`
SELECT p.id,p.name,p.price,p.quantity,p.currency,p.active,
p.created_date,p.updated_date,
(SELECT  ROW_TO_JSON(category_obj) FROM(
SELECT id,name FROM category WHERE id=p.category_id)category_obj) AS category
 from product p`);
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    if (!req.body.name) {
      return res.status(422).json({ error: "Name is Required" });
    }
    if (!req.body.price) {
      return res.status(422).json({ error: "Price is Required" });
    }
    if (!req.body.category_id) {
      return res.status(422).json({ error: "Category_id is Required" });
    } else {
      const existResult = await database.pool.query({
        text: "SELECT EXISTS (SELECT * FROM category WHERE id=$1)",
        values: [req.body.category_id],
      });
      if (!existResult.rows[0].exists) {
        return res.status(422).json({ error: "Category id Not Found" });
      }
    }

    const result = await database.pool.query({
      text: `INSERT INTO product (name,description,price,currency,quantity,active,category_id)
            VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING * `,
      values: [
        req.body.name,
        req.body.description ? req.body.description : null,
        req.body.price,
        req.body.currency ? req.body.currency : "USD",
        req.body.quantity ? req.body.quantity : 0,
        // req.body.active ? req.body.active : true,
        "active" in req.body ? req.body.active : true,
        req.body.category_id,
      ],
    });
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    if (
      !req.body.name ||
      !req.body.description ||
      !req.body.price ||
      !req.body.currency ||
      !req.body.quantity ||
      !req.body.active ||
      !req.body.category_id
    ) {
      return res.status(422).json("All Fields are required");
    }

    const existResult = await database.pool.query({
      text: "SELECT EXISTS (SELECT * FROM category WHERE id=$1)",
      values: [req.body.category_id],
    });
    if (!existResult.rows[0].exists) {
      return res.status(422).json({ error: "Category id Not Found" });
    }

    const result = await database.pool.query({
      text: `UPDATE product
            SET name=$1,description=$2,price=$3,currency=$4,quantity=$5,active=$6,
            category_id=$7,updated_date=CURRENT_TIMESTAMP
            WHERE id=$8 RETURNING*`,
      values: [
        req.body.name,
        req.body.description,
        req.body.price,
        req.body.currency,
        req.body.quantity,
        req.body.active,
        req.body.category_id,
        req.params.id,
      ],
    });
    if (result.rowCount == 0) {
      return res.status(404).json({ error: "Product Not Found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const result = await database.pool.query({
      text: "DELETE FROM product WHERE id=$1",
      values: [req.params.id],
    });
    if (result.rowCount == 0) {
      return res.status(404).json({ error: "Product Not found" });
    }
    return res.status(200).send(404);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
exports.getProductById = async (req, res) => {
  try {
    const result = await database.pool.query({
      text: `
SELECT p.id,p.name,p.price,p.quantity,p.currency,p.active,
p.created_date,p.updated_date,
(SELECT  ROW_TO_JSON(category_obj) FROM(
SELECT id,name FROM category WHERE id=p.category_id)category_obj) AS category
 from product p
 WHERE p.id=$1`,
      values: [req.params.id],
    });
    if (result.rowCount == 0) {
      return res.status(404).json({ error: "No Product Found for this id" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
exports.getProductByCategoryId = async (req, res) => {
 
      try {
        const categoryId = req.params.categoryId;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;

          
        const existResult = await database.pool.query({
          text: "SELECT EXISTS (SELECT 1 FROM category WHERE id=$1)",
          values: [categoryId],
        });
        if (!existResult.rows[0].exists) {
          return res.status(404).json({ error: "Category id Not Found" });
        }

         
        const countResult = await database.pool.query({
          text: "SELECT COUNT(*) FROM product WHERE category_id=$1",
          values: [categoryId],
        });
        const totalCount = parseInt(countResult.rows[0].count);

          
        const result = await database.pool.query({
          text: `
        SELECT p.id, p.name, p.price, p.quantity, p.currency, p.active,
               p.created_date, p.updated_date,
               (SELECT ROW_TO_JSON(category_obj) 
                FROM (SELECT id, name 
                      FROM category 
                      WHERE id=p.category_id) category_obj) AS category
        FROM product p
        WHERE category_id=$1
        LIMIT $2 OFFSET $3`,
          values: [categoryId, pageSize, offset],
        });

          
        return res.status(200).json({
          products: result.rows,
          pagination: {
            total: totalCount,
            page: page,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
          },
        });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
};
    
exports.getProductsByCategoryIdAndPriceRange = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const minPrice = parseFloat(req.query.minPrice) || null;
    const maxPrice = parseFloat(req.query.maxPrice) || null;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    // Check if the category exists
   
    const categoryExist = await categoryExists(categoryId);

    if (!categoryExist) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Get total count of products
    const totalCount = await getProductCount(categoryId, minPrice, maxPrice);

    // Get products with pagination and filtering
    const products = await getFilteredProducts(
      categoryId,
      minPrice,
      maxPrice,
      pageSize,
      offset
    );

    // Return the products and pagination info
    return res.status(200).json({
      products: products,
      pagination: {
        total: totalCount,
        page: page,
        pageSize: pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Function to check if a category exists
 async function categoryExists(categoryId) {
   const existResult = await database.pool.query({
     text: "SELECT EXISTS (SELECT 1 FROM category WHERE id=$1)",
     values: [categoryId],
   });
   return existResult.rows[0].exists;
 }

// Function to get the total count of products with filtering
async function getProductCount(categoryId, minPrice, maxPrice) {
  let countQueryText = "SELECT COUNT(*) FROM product WHERE category_id=$1";
  const countQueryValues = [categoryId];

  if (minPrice !== null) {
    countQueryText += ` AND price >= $2`;
    countQueryValues.push(minPrice);
  }

  if (maxPrice !== null) {
    countQueryText += ` AND price <= $${countQueryValues.length + 1}`;
    countQueryValues.push(maxPrice);
  }

  const countResult = await database.pool.query({
    text: countQueryText,
    values: countQueryValues,
  });

  return parseInt(countResult.rows[0].count);
}

// Function to get filtered products with pagination
async function getFilteredProducts(
  categoryId,
  minPrice,
  maxPrice,
  pageSize,
  offset
) {
  let queryText = `
    SELECT p.id, p.name, p.price, p.quantity, p.currency, p.active,
           p.created_date, p.updated_date,
           (SELECT ROW_TO_JSON(category_obj) 
            FROM (SELECT id, name 
                  FROM category 
                  WHERE id=p.category_id) category_obj) AS category
    FROM product p
    WHERE category_id=$1`;

  const queryValues = [categoryId];

  if (minPrice !== null) {
    queryText += ` AND price >= $2`;
    queryValues.push(minPrice);
  }

  if (maxPrice !== null) {
    queryText += ` AND price <= $${queryValues.length + 1}`;
    queryValues.push(maxPrice);
  }

  queryText += ` LIMIT $${queryValues.length + 1} OFFSET $${
    queryValues.length + 2
  }`;
  queryValues.push(pageSize, offset);

  const result = await database.pool.query({
    text: queryText,
    values: queryValues,
  });

  return result.rows;
}
