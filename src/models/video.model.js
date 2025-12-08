import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema({
    videoFile:{
        type:String,
        required:true,
    },
    thumbnail:{
        type:String,
        required:true,
    },
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    duration:{
        type:Number,   //cloudinary provides duration in seconds
        required:true,
    },
    views:{
        type:Number,
        default:0,
    },
    isPublished:{    //ispublic video 
        type:Boolean,
        default:true,
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

},{timestamps:true});

videoSchema.plugin(mongooseAggregatePaginate);
//aggregation queries takes the project to next level


export const Video = mongoose.model("Video",videoSchema)
