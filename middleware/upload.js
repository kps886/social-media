const multer = require("multer")
const {GridFsStorage} = require("multer-gridfs-storage")

const storage = new GridFsStorage({
    url:process.env.DB,
    options:{
        useNewUrlParses:true,
        useUnifiedTopology:true
    },
    file:(req,res)=>{
        const match = ["image/png","image/jpg"];
        if(match.indexOf(file.mimetype) === -1){
            const filename = `${Date.now()}-any-name-${file.originalname}`;
            return filename
        }
        return{
            bucketName:"photos",
            filename:`${Date.now()}-any-name-${file.originalname}`
        }
    }
})

module.exports = multer({storage})