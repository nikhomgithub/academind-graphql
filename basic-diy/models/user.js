const mongoose=require('mongoose');

const Schema=mongoose.Schema;

const userSchema=new Schema({
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    
    createdEvents:[{//one user can have many event
        type:Schema.Types.ObjectId,//object id of event
        ref:'Event'
    }],
    
});

module.exports = mongoose.model('User',userSchema);