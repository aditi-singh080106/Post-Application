const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username:String,
    name:String,
    age:Number,
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:String,
    posts:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"post"
        }
    ]
});

module.exports = mongoose.model("user",userSchema);
console.log("Mongoose instance id:", mongoose.connection.id);
