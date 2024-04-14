import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import AuthRoutes from "./routes/AuthRoutes.js";
import MessageRoutes from "./routes/MessageRoutes.js";
import { Server } from "socket.io";
dotenv.config()

const app = express();
app.use(cors({
    origin:"*",
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use("/uploads/images",express.static("uploads/images")); 

app.use("/uploads/recordings",express.static("uploads/recordings")); 
app.use("/api/auth",AuthRoutes); 
app.use("/api/messages",MessageRoutes);
const port = process.env.PORT || 5000;
const server = app.listen(port,()=>{
    console.log(`listening on ${port}`);
});

const io = new Server(server,{
    cors:{
        origin:"http://localhost:3000"
    }
});

io.on("connection",(socket)=>{
    global.chatSocket = socket;
    socket?.on("add-user",(userId)=>{
        global?.onlineUsers.set(userId,socket?.id)
    })
    socket.on("send-msg",(data)=>{
        
        const sendUserSocket = onlineUsers?.get(data.to);
        if(sendUserSocket){
            socket?.to(sendUserSocket).emit("msg-recieve",{
                
                from:data.from,
                message:data.message
            }
            )
        }
    });
    socket.on("outgoing-voice-call",(data)=>{
        const sendUserSocket = onlineUsers?.get(data?.to);
        const{roomId,callType,from,profilePicture}= data;
        console.log(data,"outgoing-voice-call",sendUserSocket,data.to);

        if(sendUserSocket){

            socket.to(sendUserSocket).emit("incoming-voice-call",{
                from,roomId,callType,profilePicture
            });
        }

    });
    socket.on("outgoing-video-call",(data)=>{
        const sendUserSocket = onlineUsers?.get(data.to);
        console.log(data,socket.id,"outgoing-video-call",sendUserSocket);
        const{roomId,callType,from,profilePicture}= data;
        if(sendUserSocket){
            socket.to(sendUserSocket).emit("incoming-video-call",{
                roomId,callType,from,profilePicture
            });
        }
        
    });
    socket.on("reject-voice-call",(data)=>{

        const sendUserSocket =onlineUsers?.get(data.to);
        if(sendUserSocket){
            socket.to(sendUserSocket).emit("voice-call-rejected");
        }
    })
    socket.on("reject-video-call",(data)=>{

        const sendUserSocket =onlineUsers?.get(data.to);
        if(sendUserSocket){
            socket.to(sendUserSocket).emit("video-call-rejected");
        }
    })
    socket.on("accept-incoming-call",({id})=>{
        const sendUserSocket =onlineUsers?.get(id);
        socket.to(sendUserSocket).emit("accept-call");
    });
})

global.onlineUsers = new Map();