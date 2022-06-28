const mongoose = require("mongoose")
const validator = require("validator")
const {ObjectId} = mongoose.Schema.Types

const commentSchema = new mongoose.Schema({
    comment:String,
    date:{
        type:Date,
        default:Date.now()
    },
    commentedBy:{
        type:ObjectId,
        ref:"User"
    },
    onPost:{
        type:ObjectId,
        ref:"Post"
    }
})

const Comment = mongoose.model("Comment",commentSchema)

module.exports = Comment