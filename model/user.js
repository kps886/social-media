const mongoose = require("mongoose")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const {ObjectId} = mongoose.Schema.Types

const userSchema = new mongoose.Schema({
    Email:{
        type:String,
        require:true,
        unique:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email Id")
            }
        }
    },
    name:{
        type:String,
        required:true
    },
    Password:{
        type:String,
        required:true
    },
    jwtTokens:[{
        token:String
    }],
    verify:Boolean,
    blockedBy:[{
        id:{
            type:ObjectId,
            ref:"User"
        }
    }],
    resetToken:String,
    expireToken:Date
})

const User = mongoose.model("User",userSchema)


userSchema.methods.generate = async function(){
    console.log(this)
}
userSchema.methods.generateToken = async function(){
    try {

        const token = await jwt.sign({_id:this.UserId},process.env.Secret)
  
        this.jwtTokens = this.jwtTokens.concat({token})
        this.save()
        return token
    } catch (error) {
        
    }
}

module.exports = User