const { z } = require("zod");

const bookSchema = z.object({
  book_title: z.string().min(1, "book is required"),
  // rent_amount: z.number("Amount must be number"),
  author: z.string().min(1, "author is required"),
  // quantity: z.number().min(1, "quantity must be number"),
});

module.exports = bookSchema;
