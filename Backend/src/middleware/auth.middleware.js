import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.get?.("Authorization");
    const authHeaderToken = authHeader?.toLowerCase().startsWith("bearer ")
      ? authHeader.slice(7).trim()
      : undefined;
    const cookieToken = req.cookies?.token;
    const fallbackToken = req.headers["x-access-token"];
    const token = authHeaderToken || cookieToken || fallbackToken;

    if (!token) return res.status(401).json({ msg: "No token" });

    const decoded = jwt.verify(String(token), process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
};
