const mongoose = require("mongoose");




const eventSchema = new mongoose.Schema({
    name : {
      type :  String,
      required : true,
    },
    date : {
      type : Date,
      required : true
    },
    description : {
        type : String,
        required : true
    },
    eventNo : {
        type : Number,
        required : true
    }
})


const Event = new mongoose.model("DataEvent", eventSchema);

module.exports = Event;