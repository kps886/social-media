const mongoose = require("mongoose")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const {ObjectId} = mongoose.Schema.Types

const bookSchema = new mongoose.Schema({  
    bookOn:{
            type:ObjectId,
            ref:"Post"
            },
    bookAt:{
        type:Date,
        default:Date.now()
    },
    bookBy:{
        type:ObjectId,
        ref:"User"
    }
})

const Book = mongoose.model("Book",bookSchema)

module.exports = Book
