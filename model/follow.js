const mongoose = require("mongoose")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const {ObjectId} = mongoose.Schema.Types

const followSchema = new mongoose.Schema({  
    followedBy:{
            type:ObjectId,
            ref:"User"
            },
    followedTo:{
        type:ObjectId,
        ref:"User"
    }
})

const Follow = mongoose.model("Follow",followSchema)

module.exports = Follow
