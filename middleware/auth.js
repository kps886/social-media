const User = require("../model/user")
const jwt = require("jsonwebtoken")
const auth = async function(req,res,next){
    try {
        let token = req.cookies.jwt;
        let verify = jwt.verify(token,process.env.Secret)
        const user = await User.findOne({_id:verify._id})
        if(user){
            req.token =token
            req.user = user
            req.login=true
            next()
        }
        else{
            res.clearCookie("jwt")
            res.clearCookie("id")
            res.redirect("/")
        }
    } catch (err) {
        if(err.message == "jwt must be provided"){
            res.redirect("/")
        }
        else{
        res.json({err:err})}
    }
}
const hauth = async function(req,res,next){
    try {
        let token = req.cookies.jwt;
        let verify = jwt.verify(token,process.env.Secret)
        const user = await User.findOne({_id:verify._id})
        if(user){
            req.login=true
            next()
        }
        else{
            req.login = false;
            next()
        }
    } catch (err) {
        if(err.message == "jwt must be provided"){
            req.login=false
            next()
        }
        else{
        res.json({err:err})}
    }
}
module.exports = {auth,hauth}