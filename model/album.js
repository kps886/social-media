const mongoose = require("mongoose")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const {ObjectId} = mongoose.Schema.Types

const albumSchema = new mongoose.Schema({
    name:String
})

const Album = mongoose.model("Album",albumSchema)

module.exports = Album
