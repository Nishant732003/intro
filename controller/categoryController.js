const database = require("../Services/database");

exports.getAllCategories = async (req, res) => {
  try {
    const result = await database.pool.query("SELECT * FROM category");
    return res.status(200).json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
exports.createCategory = async (req, res) => {
    try {
        if (!req.body.name) {
            return res.status(422).json({ error: "Name is required" });
        }
       const existResult = await database.pool.query({
         text: "SELECT EXISTS (SELECT 1 FROM category WHERE name = $1)",
         values: [req.body.name],
       });

       if (existResult.rows[0].exists) {
         return res
           .status(409)
           .json({ error: `Category ${req.body.name} already exists` });
       }

        if (existResult.rows[0].exist) {
            return res.status(409).json({ error: `Category ${req.body.name} already exists` });
        }
        const result = await database.pool.query({
            text: 'INSERT INTO category (name) VAlUES($1) RETURNING*',
            values: [req.body.name]
        })
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

exports.updateCategory = async (req, res) => {
    try {
       if (!req.body.name) {
         return res.status(422).json({ error: "Name is required" });
        }

         const existResult = await database.pool.query({
           text: "SELECT EXISTS (SELECT 1 FROM category WHERE name = $1)",
           values: [req.body.name],
         });

         if (existResult.rows[0].exists) {
           return res
             .status(409)
             .json({ error: `Category ${req.body.name} already exists` });
        }
        
    const result = await database.pool.query({
      text: "UPDATE category SET name=$1, updated_date=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *",
        values: [req.body.name,req.params.id],
    });
        
        if (result.rowCount == 0) {
            return res.status(404).json({error:'Category Not Found'})
        }
    return res.status(200).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
    try {
          
      
        const countResult = await database.pool.query({
            text: 'SELECT COUNT(*) FROm product WHERE category_id=$1',
            values:[req.params.id]
        })

        if (countResult.rows[0].count > 0) {
      return res.status(409).json({error:`Category is being used in ${countResult.rows[0].count} product`})
  }
        const result = await database.pool.query({
            text: 'DELETE FROM category WHERE id=$1',
            values:[req.params.id]
        }) 
        if (result.rowCount == 0) {
            return res.status(404).json({ error: 'category not found' });
        }
        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}