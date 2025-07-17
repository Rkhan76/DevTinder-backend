const STATUS_CODES = require("../utils/httpStatusCode")

const handleAddPost = (req, res)=>{
    console.log("handle add post get hitted")
    const {userId, content} = req.body
    
    if(!userId || !content){
        return res.status(STATUS_CODES.BAD_REQUEST).json({
            success: false,
            message: "Please give the right input"
        })
    }

    
    
}

module.exports = {
    handleAddPost
}