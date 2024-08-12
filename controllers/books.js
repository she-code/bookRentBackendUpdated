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

    // Check if the book already exists for the same user
    let book = await Book.findOne({
      where: { book_title, author, categoryId },
      include: [
        {
          model: BookCopy,
          as: "copies",
          where: { ownerId },
        },
      ],
    });

    // If the book exists for the same user, return a message to update the book
    if (book && book.copies.length > 0) {
      return res.status(400).json({
        message:
          "You have already uploaded this book. Please update the existing book instead.",
      });
    }

    // If the book does not exist, create a new book entry
    if (!book) {
      book = await Book.create({ book_title, author, categoryId });
    }

    // Handle file uploads
    const bookFiles = {};
    if (files) {
      if (files["image"]) {
        bookFiles["image"] =
          process.env.SERVER_URL + "uploads/" + files["image"][0].filename;
      }
      if (files["file"]) {
        bookFiles["file"] =
          process.env.SERVER_URL + "uploads/" + files["file"][0].filename;
      }
    }

    // Create a new book copy associated with the book and the new owner
    const bookCopy = await BookCopy.create({
      bookId: book.id,
      ownerId,
      availability: "available",
      rentalPrice: rentalPrice,
      condition: condition,
      quantity,
      image: bookFiles["image"] || null,
      file: bookFiles["file"] || null,
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

    res.status(201).json(result);
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "Error uploading book", error });
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
          model: Book,
          as: "book",
          attributes: ["book_title", "author", "description"],
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
          attributes: ["id", "rentalPrice", "condition", "quantity"],
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
    const userId = req.user; // Assuming req.user contains the authenticated user's ID
    const bookId = req.params.id;

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

    // Find and delete the book
    const deletedCount = await Book.destroy({
      where: { id: bookId },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Book not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting book:", error);
    return res.status(500).json({
      status: "error",
      message: "An error occurred while deleting the book",
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
