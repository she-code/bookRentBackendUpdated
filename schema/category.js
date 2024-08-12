const { z } = require("zod");

const categorySchema = z.object({
  category_name: z.string().min(1, "Category is required"),
});

module.exports = categorySchema;
