// function validate(schema){
//     return(req,res,next)=>{
//          const result = schema.safeParse(req.body);

//          if(!result.success){
//             return res.status(400).json({
//                 success: false,
//                 error: {
//                     code: "VALIDATION_ERROR",
//                     message: result.error.issues[0].message,
//                 },
//             });
//          }

//          req.body = result.data;
//          next();
//     };
// }

function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: result.error.issues[0].message,
        },
      });
    }

    req[target] = result.data;
    next();
  };
}

module.exports = validate;