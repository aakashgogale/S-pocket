
const mongoose = require("mongoose")

function  conectedToDataBase(){
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Conected to Database");
    })
}

module.exports = conectedToDataBase
