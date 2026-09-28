const jwt = require("jsonwebtoken");

const env = require("../config/env");
const { AuthError } = require("../errors/AppError");

function requireAuth(req,res,next){
 const authHeader = req.headers.authorization;

 if(!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
        new AuthError("Authentication required")
    );
 }
 const token = authHeader.split(" ")[1];
 try{
    const decoded = jwt.verify(
        token,
        env.jwtAccessSecret
    );

    req.user={
        id: decoded.userId,
    };
    next();
 }catch(err){
    next(
        new AuthError("Invalid or expired token")
    );
 }
 
}
module.exports={
    requireAuth,
 };