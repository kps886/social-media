const mongoose = require("mongoose")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const {ObjectId} = mongoose.Schema.Types

const albumPSchema = new mongoose.Schema({
    name:String, 
    albumId:{
        type:ObjectId,
        ref:"Album"
    },   
    postedBy:{
            type:ObjectId,
            ref:"User"
            },
    postedAt:{
        type:Date,
        default:Date.now()
    }
})

const aPhotos = mongoose.model("AlbumPhotos",albumPSchema)

module.exports = aPhotos
