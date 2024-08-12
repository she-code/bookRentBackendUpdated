const defineAbilitiesFor = require("../utils/abilities");
const { returnUser } = require("../utils/auth");
const { Rent, Book } = require("../models");
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
      const rents = await Rent.findAll();
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
    const user = returnUser(userID);
    if (!user)
      return res.status(404).json({
        status: "fail",
        message: "no user found",
      });
    const abilities = defineAbilitiesFor(user);
    if (!abilities.can("read", "Rent")) {
      const rents = await Rent.findAll({ where: { ownerId: user.id } });
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
