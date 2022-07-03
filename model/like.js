const mongoose = require("mongoose")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const {ObjectId} = mongoose.Schema.Types

const likeSchema = new mongoose.Schema({  
    likedOn:{
            type:ObjectId,
            ref:"Post"
            },
    likedAt:{
        type:Date,
        default:Date.now()
    },
    likedBy:{
        type:ObjectId,
        ref:"User"
    }
})

const Like = mongoose.model("Like",likeSchema)

module.exports = Like
