const categorySchema = require("../schema/category");
const { Category } = require("../models");

exports.addCategory = async (req, res) => {
  try {
    categorySchema.parse(req.body);
    category_name = req.body.category_name;
    const category = await Category.create({
      category_name,
    });
    if (category) {
      res.status(201).json({
        status: "success",
        data: category,
        message: "Category successfully created",
      });
    }
  } catch (error) {
    console.log(error);
    if ((error = "SequelizeUniqueConstraintError")) {
      res
        .status(500)
        .json({ status: "fail", mesage: "Category name must be unique" });
    } else res.status(500).json({ status: "fail", mesage: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    if (categories) {
      res.status(200).json({
        status: "success",
        data: categories,
        message: "Category retrived successfully",
      });
    }
  } catch (error) {
    res.status(500).json({ status: "fail", mesage: error.message });
  }
};
