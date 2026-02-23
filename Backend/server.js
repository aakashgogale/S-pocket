// server runing 
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first"); 

require("dotenv").config()
const app = require("./src/app")
const conectedToDataBase = require("./src/config/database")

conectedToDataBase()
app.listen(3000, ()=>{
    console.log("Server is runing on port 3000");
})