const jwt = require('jsonwebtoken');

// This function runs BEFORE a protected route's controller.
// Its job: check if the request has a valid token, and if so,
// attach the user's info to req.user so the controller can use it.
function protect(req, res, next) {

    // 1. Get the Authorization header
    const authHeader = req.headers.authorization;

    // 2. Check it exists and follows the "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // 3. Extract just the token part (everything after "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // 4. Verify the token's signature and expiry using our secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Attach the decoded payload (userId, email) to req.user
        //    Every controller after this point can now read req.user
        req.user = decoded;

        // 6. Let the request continue to the actual route handler
        next();

    } catch (err) {
        // jwt.verify throws if token is expired, malformed, or tampered with
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { protect };