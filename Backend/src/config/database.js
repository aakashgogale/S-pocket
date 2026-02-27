
const mongoose = require("mongoose")

async function  conectedToDataBase(){
   await mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Conected to Database");
    })
}

module.exports = conectedToDataBase
