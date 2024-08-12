const { z } = require("zod");

// Zod schema for validating user data
const registerSchema = z.object({
  firstName: z.string().min(1, "First Name is required"),
  lastName: z.string().min(1, "Last Name is required"),
  email: z.string().min(1, "Email is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "password is required"),

  location: z.string().min(1, "Location is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),

  // userType: z.enum(["owner", "admin", "customer"], "Invalid user type"),
});
const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(1, "password is required"),

  email: z.string().email("Invalid email address"),
});
module.exports = { registerSchema, loginSchema };
