import jwt from "jsonwebtoken";

// Generate JWT with user id and role
export const generateToken = (user) => {
  const payload = {
    id: user._id ?? user.id,
    role: user.role ?? "user"
  };

  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};
