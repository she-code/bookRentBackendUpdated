const { Op } = require("sequelize");
const bookSchema = require("../schema/book");

const { Book, User, Category, BookCopy } = require("../models");
const defineAbilitiesFor = require("../utils/abilities");
const { returnUser } = require("../utils/auth");

exports.uploadBook = async (req, res) => {
  const { book_title, author, categoryId, rentalPrice, condition, quantity } =
    req.body;
  const ownerId = req.user;
  const files = req.files;

  try {
    const user = await returnUser(ownerId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const ability = defineAbilitiesFor(user);
    if (!ability.can("create", "Book")) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have access",
      });
    }

    // Check if the book already exists
    let book = await Book.findOne({
      where: { book_title, author, categoryId },
      include: [
        {
          model: BookCopy,
          as: "copies",
          where: { ownerId },
          required: false, // Include BookCopy even if it does not exist
        },
      ],
    });

    if (book) {
      // Book exists
      if (book.copies.length > 0) {
        // Book already has a copy from the same owner
        return res.status(400).json({
          message:
            "You have already uploaded this book. Please update the existing book instead.",
        });
      } else {
        // Book exists but the owner doesn't own it
        const bookCopy = await BookCopy.create({
          bookId: book.id,
          ownerId,
          availability: "available",
          rentalPrice,
          condition,
          quantity,
          image: files?.["image"]
            ? process.env.SERVER_URL + "uploads/" + files["image"][0].filename
            : null,
          file: files?.["file"]
            ? process.env.SERVER_URL + "uploads/" + files["file"][0].filename
            : null,
        });

        // Fetch book copy details including user information
        const result = await BookCopy.findOne({
          where: { id: bookCopy.id },
          include: [
            {
              model: Book,
              as: "book",
            },
            {
              model: User,
              as: "owner",
              attributes: ["firstName", "lastName", "location"],
            },
          ],
        });

        return res.status(201).json(result);
      }
    } else {
      // Book does not exist, create a new book and book copy
      book = await Book.create({ book_title, author, categoryId });

      const bookCopy = await BookCopy.create({
        bookId: book.id,
        ownerId,
        availability: "available",
        rentalPrice,
        condition,
        quantity,
        image: files?.["image"]
          ? process.env.SERVER_URL + "uploads/" + files["image"][0].filename
          : null,
        file: files?.["file"]
          ? process.env.SERVER_URL + "uploads/" + files["file"][0].filename
          : null,
      });

      // Fetch book copy details including user information
      const result = await BookCopy.findOne({
        where: { id: bookCopy.id },
        include: [
          {
            model: Book,
            as: "book",
          },
          {
            model: User,
            as: "owner",
            attributes: ["firstName", "lastName", "location"],
          },
        ],
      });

      return res.status(201).json(result);
    }
  } catch (error) {
    console.error("Error uploading book:", error);
    return res.status(500).json({
      status: "fail",
      message: "Error uploading book",
      error: error.message,
    });
  }
};

exports.getOwnerBooks = async (req, res) => {
  try {
    const owner_id = req.user; // Get the current user's ID
    const user = await returnUser(owner_id); // Fetch user details

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const ability = defineAbilitiesFor(user);

    // Check if the user has permission to read books
    if (!ability.can("read", "Book")) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have access",
      });
    }

    // Fetch book copies and include book details and owner details
    const bookCopies = await BookCopy.findAll({
      where: { ownerId: owner_id },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "location"],
        },

        {
          model: Book,
          as: "book",
          include: [{ model: Category, attributes: ["category_name", "id"] }],
        },
      ],
    });

    if (bookCopies.length > 0) {
      return res.status(200).json({
        status: "success",
        data: bookCopies,
        message: "Book copies retrieved successfully",
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "No book copies found for this owner",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

exports.getApprovedBooks = async (req, res) => {
  try {
    // Fetch books with their approved copies included
    const books = await Book.findAll({
      attributes: ["id", "book_title", "author", "categoryId", "description"],
      include: [
        {
          model: BookCopy,
          as: "copies",
          attributes: ["id", "rentalPrice", "condition", "quantity", "image"],
          where: {
            approved: true,
            availability: "available",
            quantity: {
              [Op.gt]: 0,
            },
          },
          include: [
            {
              model: User,
              as: "owner",
              attributes: ["id", "firstName", "lastName", "location"],
              where: {
                isDisabled: false,
                isApproved: true,
                status: "active",
              },
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      data: books,
      message: "Books retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving books:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while retrieving books",
    });
  }
};

exports.getAllBooks = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const ability = defineAbilitiesFor(user);

    if (!ability.can("read", "Book")) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have access",
      });
    }

    let bookCopies;

    if (user.userType === "admin") {
      // Admin can see all book copies
      bookCopies = await BookCopy.findAll({
        include: [
          {
            model: Book,
            as: "book",
            attributes: ["id", "book_title", "author", "description"],
            include: [{ model: Category, attributes: ["category_name", "id"] }],
          },
          {
            model: User,
            as: "owner",
            attributes: ["id", "firstName", "lastName", "location"],
          },
        ],
      });
    } else {
      // Non-admin users can only see book copies they have access to
      bookCopies = await BookCopy.findAll({
        include: [
          {
            model: Book,
            as: "book",
            attributes: ["id", "book_title", "author", "description"],
            include: [{ model: Category, attributes: ["category_name", "id"] }],
          },
          {
            model: User,
            as: "owner",
            attributes: ["id", "firstName", "lastName", "location"],
            where: {
              id: userId, // Show only copies owned by the logged-in user
            },
          },
        ],
      });
    }

    return res.status(200).json({
      status: "success",
      data: bookCopies,
      message: "Book copies retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving book copies:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while retrieving book copies",
    });
  }
};

exports.getNewBooks = async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const ability = defineAbilitiesFor(user);

    if (!ability.can("read", "Book")) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have access",
      });
    }

    const books = await Book.findAll({ where: { status: "pending" } });

    return res.status(200).json({
      status: "success",
      data: books,
      message: "Books retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving books:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while retrieving books",
    });
  }
};
exports.deleteBook = async (req, res) => {
  try {
    const userId = req.user;
    const bookCopyId = req.params.id;

    // Retrieve the user and check permissions
    const user = await returnUser(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const abilities = defineAbilitiesFor(user);
    if (!abilities.can("delete", "Book")) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission",
      });
    }

    // Find the book copy to be deleted
    const bookCopy = await BookCopy.findByPk(bookCopyId);
    if (!bookCopy) {
      return res.status(404).json({
        status: "fail",
        message: "Book copy not found",
      });
    }

    // Find the book associated with the book copy
    const book = await Book.findByPk(bookCopy.bookId);
    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    // Delete the book copy
    const deletedCount = await BookCopy.destroy({
      where: { id: bookCopyId },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Book copy not found",
      });
    }

    // Check if the book has any other copies left
    const remainingCopies = await BookCopy.count({
      where: { bookId: book.bookId },
    });

    // If no copies remain, delete the book
    if (remainingCopies === 0) {
      await Book.destroy({
        where: { id: book.bookId },
      });
    }

    return res.status(200).json({
      status: "success",
      message:
        "Book copy deleted successfully, book removed if it was the only copy",
    });
  } catch (error) {
    console.error("Error deleting book copy:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting the book copy",
    });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const userId = req.user;
    const bookCopyId = req.params.id;

    // Retrieve the user and check permissions
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const abilities = defineAbilitiesFor(user);
    if (!abilities.can("update", "BookCopy")) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission",
      });
    }

    // Validate and sanitize input fields
    const updateFields = req.body;
    const validFields = [
      "quantity",
      "availability",
      "rentalPrice",
      "condition",
    ];

    // Check if input fields are valid
    for (const key of Object.keys(updateFields)) {
      if (!validFields.includes(key)) {
        return res.status(400).json({
          status: "fail",
          message: `Invalid field: ${key}`,
        });
      }
    }

    // Find and update the book copy
    const [updatedCount] = await BookCopy.update(updateFields, {
      where: { id: bookCopyId },
      returning: true, // Optional: returns the updated book copy
    });

    if (updatedCount === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Book copy not found",
      });
    }

    // Retrieve updated book copy details along with book and owner
    const updatedBookCopy = await BookCopy.findByPk(bookCopyId, {
      include: [
        {
          model: Book,
          as: "book",
          attributes: ["id", "book_title", "author", "description"],
          include: [{ model: Category, attributes: ["category_name", "id"] }],
        },
        {
          model: User,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "location"],
        },
      ],
    });

    return res.status(200).json({
      status: "success",
      message: "Book copy updated successfully",
      data: updatedBookCopy,
    });
  } catch (error) {
    console.error("Error updating book copy:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while updating the book copy",
    });
  }
};
exports.getBookRequests = async (req, res) => {
  try {
    const userId = req.user;
    const user = await returnUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const abilities = defineAbilitiesFor(user);
    if (!abilities.can("read", "BookCopy")) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Fetch books with their associated copies where the book copies are pending approval
    const books = await BookCopy.findAll({
      where: {
        approved: false,
        rejected: false,
      },
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "location"],
        },

        {
          model: Book,
          as: "book",
          include: [{ model: Category, attributes: ["category_name"] }],
        },
      ],
    });

    if (books.length === 0) {
      return res.status(404).json({ message: "No book requests found" });
    }

    return res.status(200).json({
      status: "sucess",
      message: "Book requests retrieved successfully",

      data: books,
    });
  } catch (error) {
    console.error("Error fetching book requests:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getBook = async (req, res) => {
  try {
    const bookId = req.params.id;

    // Fetch the book along with its copies and the owner details
    const book = await Book.findByPk(bookId, {
      include: [
        {
          model: BookCopy,
          as: "copies",
          where: {
            approved: true,
            availability: "available",
            quantity: {
              [Op.gt]: 0,
            },
          },
          attributes: [
            "id",
            "quantity",
            "availability",
            "rentalPrice",
            "condition",
            "approved",
            "rejected",
          ],
          include: [
            {
              model: User,
              as: "owner",
              where: {
                isDisabled: false,
                status: "active",
                isApproved: true,
              },
              attributes: ["id", "firstName", "lastName", "location"],
            },
          ],
        },
        {
          model: Category,
          attributes: ["category_name"],
        },
      ],
    });

    if (!book) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: book,
      message: "Book retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving book:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while retrieving the book",
    });
  }
};

exports.getBookCopyEdit = async (req, res) => {
  try {
    const bookCopyId = req.params.id;

    // Fetch the book copy along with its associated book and owner details
    const bookCopy = await BookCopy.findByPk(bookCopyId, {
      include: [
        {
          model: Book,
          as: "book",
          attributes: [
            "id",
            "book_title",
            "author",
            "categoryId",
            "description",
          ],
          include: [
            {
              model: Category,
              attributes: ["category_name", "id"],
            },
          ],
        },
        {
          model: User,
          as: "owner",

          attributes: ["id", "firstName", "lastName", "location"],
        },
      ],
    });

    if (!bookCopy) {
      return res.status(404).json({
        status: "fail",
        message: "Book copy not found",
      });
    }

    return res.status(200).json({
      status: "success",
      data: bookCopy,
      message: "Book copy retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving book copy:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while retrieving the book copy",
    });
  }
};

exports.getBookCopy = async (req, res) => {
  try {
    const bookCopyId = req.params.id;

    // Fetch the book copy along with its associated book and owner details
    const bookCopy = await BookCopy.findOne({
      where: {
        id: bookCopyId,
        approved: true,
        rejected: false,
        availability: "available",
        quantity: {
          [Op.gt]: 0,
        },
      },
      include: [
        {
          model: Book,
          as: "book",
          attributes: [
            "id",
            "book_title",
            "author",
            "categoryId",
            "description",
          ],
          include: [
            {
              model: Category,
              attributes: ["category_name", "id"],
            },
          ],
        },
        {
          model: User,
          as: "owner",
          where: {
            isDisabled: false,
            status: "active",
            isApproved: true,
          },
          attributes: ["id", "firstName", "lastName", "location"],
        },
      ],
    });

    if (!bookCopy) {
      return res.status(404).json({
        status: "fail",
        message: "Book copy not found or out of stock",
      });
    }

    return res.status(200).json({
      status: "success",
      data: bookCopy,
      message: "Book copy retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving book copy:", error);
    return res.status(500).json({
      status: "fail",
      message: "An error occurred while retrieving the book copy",
    });
  }
};

exports.updateBookStatus = async (req, res) => {
  const bookCopyId = req.params.id;
  const userId = req.user;
  const { action } = req.body;
  try {
    // Check if the user exists
    const user = await returnUser(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    }

    // Define abilities for the user
    const abilities = defineAbilitiesFor(user);

    // Check if the user has permission to update BookCopy
    if (!abilities.can("update", "BookCopy")) {
      return res.status(403).json({ status: "fail", message: "Access denied" });
    }
    if (user.userType != "admin") {
      return res
        .status(403)
        .json({ status: "fail", message: "You cant approve book" });
    }

    // Fetch the BookCopy by ID
    const bookCopy = await BookCopy.findByPk(bookCopyId, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "firstName", "lastName", "location"],
        },

        {
          model: Book,
          as: "book",
          attributes: ["book_title", "author", "categoryId"],
          include: [{ model: Category, attributes: ["category_name"] }],
        },
      ],
    });
    if (!bookCopy) {
      return res
        .status(404)
        .json({ status: "fail", message: "BookCopy not found" });
    }

    // Update the status based on the action
    if (action === "approve") {
      bookCopy.approved = true;
      bookCopy.rejected = false;
    } else if (action === "reject") {
      bookCopy.approved = false;
      bookCopy.rejected = true;
    } else {
      return res
        .status(400)
        .json({ status: "fail", message: "Invalid action" });
    }

    await bookCopy.save();

    return res.status(200).json({
      status: "success",
      message: `Book copy ${action}d successfully`,
      data: bookCopy,
    });
  } catch (error) {
    console.error(`Error ${action}ing book copy:`, error);
    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
    });
  }
};
