import jwt from "jsonwebtoken"

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];

        req.session = jwt.verify(token, process.env.JWT_SECRET, {algorithms: ["HS256"]});

        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
};


export const requiredAdmin = (req, res, next) => {
    if(req?.session?.role !== "ADMIN") {
        return res.status(403).json({error: "Admin access required"})
    }
    next()
}