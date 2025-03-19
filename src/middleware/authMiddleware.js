import jwt from "jsonwebtoken";
import { config } from "dotenv";
config();

export default function authMiddleware(req, res, next) {
  // Check for token in Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Attach decoded payload (adminId) to the request object
    req.adminId = decoded.adminId;
    next();
  });
}