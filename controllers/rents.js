const defineAbilitiesFor = require("../utils/abilities");
const { returnUser } = require("../utils/auth");
const { Rent, Book, BookCopy, User, Category } = require("../models");
exports.rentBook = async (req, res) => {
  try {
    const userID = req.user;
    const { bookId, amount } = req.body;

    // Retrieve the user and book
    const user = await returnUser(userID);
    const book = await Book.findByPk(bookId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    if (book.quantity <= 0) {
      return res
        .status(400)
        .json({ message: "No copies of the book available" });
    }

    // Create rent record
    const newRent = await Rent.create({
      bookId,
      ownerId: book.ownerId,
      amount,
    });

    if (!newRent) {
      return res.status(500).json({ message: "Failed to create rent record" });
    }

    // Decrease book quantity
    book.quantity -= 1;
    await book.save();

    res
      .status(201)
      .json({ message: "Book rented successfully", rent: newRent });
  } catch (error) {
    console.error("Error renting book:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.getAllRents = async (req, res) => {
  try {
    const userID = req.user;
    const user = returnUser(userID);
    if (!user)
      return res.status(404).json({
        status: "fail",
        message: "no user found",
      });
    const abilities = defineAbilitiesFor(user);
    if (!abilities.can("read", "Rent")) {
      const rents = await Rent.findAll({
        include: [
          {
            model: BookCopy,
            as: "bookCopy",
            include: [
              {
                model: Book,
                as: "book",
                attributes: ["book_title", "author"],
                include: [
                  {
                    model: Category,
                    attributes: ["category_name"],
                  },
                ],
              },
            ],
          },
          {
            model: User,
            as: "owner",
            attributes: ["firstName", "lastName"],
          },
          {
            model: User,
            as: "renter",
            attributes: ["firstName", "lastName"],
          },
        ],
      });
      if (rents.length > 0) {
        return res.status(200).json({
          status: "success",
          data: rents,
          message: "Rents successfully retrieved",
        });
      } else {
        return res.status(404).json({
          status: "fail",
          message: "no rents found",
        });
      }
    }
  } catch (error) {
    console.log("Error fetching rensts", error);
    return res.status(500).json({
      status: "fail",
      message: "Error fetching rensts",
    });
  }
};
exports.getOwnerRents = async (req, res) => {
  try {
    const userID = req.user;
    const user = await returnUser(userID);

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    const abilities = defineAbilitiesFor(user);

    // Check if the user has permission to read rents
    if (!abilities.can("read", "Rent")) {
      return res.status(403).json({
        status: "fail",
        message: "You don't have permission to view rents",
      });
    }

    // Fetch rents with associated book, owner, and buyer details
    const rents = await Rent.findAll({
      where: { ownerId: user.id },
      include: [
        {
          model: BookCopy,
          as: "bookCopy",
          include: [
            {
              model: Book,
              as: "book",
              attributes: ["book_title", "author"],
              include: [
                {
                  model: Category,
                  attributes: ["category_name"],
                },
              ],
            },
          ],
        },
        {
          model: User,
          as: "owner",
          attributes: ["firstName", "lastName"],
        },
        {
          model: User,
          as: "renter",
          attributes: ["firstName", "lastName"],
        },
      ],
    });

    if (rents.length > 0) {
      return res.status(200).json({
        status: "success",
        data: rents,
        message: "Rents successfully retrieved",
      });
    } else {
      return res.status(404).json({
        status: "fail",
        message: "No rents found",
      });
    }
  } catch (error) {
    console.log("Error fetching rents:", error);
    return res.status(500).json({
      status: "fail",
      message: "Error fetching rents",
    });
  }
};

exports.rentBook = async (req, res) => {
  const { bookId, ownerId, quantity, totalAmount, bookCopyId } = req.body;
  const userId = req.user;

  try {
    const user = await returnUser(userId);
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Fetch the book and the specific book copy by id
    const book = await Book.findByPk(bookId, {
      include: [
        {
          model: BookCopy,
          as: "copies",
          where: {
            id: bookCopyId,
            availability: "available",
          },
        },
      ],
    });

    if (!book || !book.copies.length) {
      return res.status(404).json({
        status: "fail",
        message: "Book copy not found or not available",
      });
    }

    const bookCopy = book.copies[0];

    // Check if there is enough quantity
    if (quantity > bookCopy.quantity) {
      return res.status(400).json({
        status: "fail",
        message: "Insufficient quantity available",
      });
    }

    // Update book copy quantity and availability
    bookCopy.quantity -= quantity;
    if (bookCopy.quantity === 0) {
      bookCopy.availability = "not_available";
    }
    await bookCopy.save();

    // Update owner's wallet balance
    const owner = await User.findByPk(ownerId);
    if (!owner) {
      return res.status(404).json({
        status: "fail",
        message: "Owner not found",
      });
    }
    owner.walletBalance += totalAmount;
    await owner.save();

    // Create the rental record
    const rent = await Rent.create({
      rentedBy: userId,
      bookCopyId: bookCopyId,
      bookId: bookId,
      ownerId: ownerId,
      quantity: quantity,
      totalAmount: totalAmount,
      status: "rented",
    });

    res.status(201).json({
      status: "success",
      message: "Book rented successfully, wallet updated",
      data: rent,
    });
  } catch (error) {
    console.error("Error renting book:", error);
    res.status(500).json({
      status: "fail",
      message: "Error renting book",
      error: error.message,
    });
  }
};
