import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber:{
        type:Schema.Types.ObjectId,
        //one who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        //the one who is being subscribed to
        ref:"User"
    }
},{timestamps:true})

export const subscription = mongoose.model("subscription",subscriptionSchema);