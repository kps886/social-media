
const mongoose = require("mongoose")
const validator = require("validator")
const {ObjectId} = mongoose.Schema.Types


const postSchema = new mongoose.Schema({
    photo:String,
    caption:String,
    hash:String,
    date:{
        type:Date,
        default:Date.now()
    },
    postedBy:{
        type:ObjectId,
        ref:"User"
    },
})

const Post = mongoose.model("Post",postSchema)

module.exports = Post