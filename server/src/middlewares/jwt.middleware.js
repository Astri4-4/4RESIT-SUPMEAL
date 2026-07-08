import jwt from "jsonwebtoken";

export async function verifyToken(req, res, next) {
    const token = req.headers["authorization"].split(" ")[1];
    if (!token) {
        return res.status(403).send({ message: "No token provided!" });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).send({ message: "Unauthorized!" });
    }
}