import GetPrismaInstance from "../utils/PrismaClient.js";
import {renameSync} from "fs"
export const addMessage= async(req,res,next)=>{
    const {message,from,to} = req.body;
    

    try { 
        const prisma = await GetPrismaInstance();
        const getUser = onlineUsers.get(to);
        if(message && from && to){
            const NewMessage = await prisma?.messages?.create({
                data:{ 
                    message,
                    sender:{connect:{id:parseInt(from)}},
                    reciever:{connect:{id:parseInt(to)}},
                    messageStatus:getUser?"delivered":"sent", 

                },
                include:{
                    sender:true,
                    reciever:true
                },
            })
            return res.status(201).json({
                message:NewMessage,
                status:true,
            })
        }
        return res.status(400).json({
            msg:"from , to, message is required",
            status:false,
        });

    } catch (error) {
        next(error);
    }
}


export const Getmessage=async (req, res, next) => {
    try {
        const prisma = await GetPrismaInstance();
        const {from,to} = req.params;
    
         
        const messages = await prisma.messages.findMany({
            where:{
                OR:[
                    {
                        senderId:parseInt(from),
                        recieverId:parseInt(to),
                    },
                    {
                        senderId:parseInt(to),
                        recieverId:parseInt(from),
                    },
                ]
            },
            orderBy:{
                id:"asc",
            }
        });
         const unreadMessges =[];
         
         messages.forEach((msg,index)=>{

            if(msg.messageStatus !=="read"&& msg.senderId === parseInt(to)){
                
                messages[index].messageStatus = "read";
                unreadMessges.push(msg.id);
            }
         });

         await prisma.messages.updateMany({
            where:{
                id:{in:unreadMessges}
            },data:{ 
 
                messageStatus :"read",
            }
         }); 
        return res.status(200).json({messages})
    } catch (error) {
        next(error);
    }
};



export const  addImageMessage = async(req, res, next) => {
    try {
        if (req.file){
            
            let newfilename  = `uploads/images/${Date.now()}_${req.file.originalname}`;
            console.log(newfilename,req.file);
            renameSync(req.file.path, newfilename);
            const prisma = await GetPrismaInstance();
            const {from, to} = req.params;
            if(from&&to){
                const message = await prisma.messages.create({
                    data:{
                        message:newfilename,
                        sender:{connect:{id:parseInt(from)}},
                        reciever:{connect:{id:parseInt(to)}},
                        type:"images",


                    },
                })
                return res.status(201).json({status:true, message})
            }
            return res.status(400).send("from ,to is required");
        }
        return res.status(400).send("image is required");

    } catch (error) {
        next(error);
    }
};



export const addAudioMessage =  async(req, res, next) => {
    try {
        if (req.file){
            
            let newfilename  = `uploads/recordings/${Date.now()}${req.file.originalname}`;
            console.log(newfilename,req.file);
            renameSync(req.file.path, newfilename);
            const prisma = await GetPrismaInstance();
            const {from, to} = req.params;
            if(from&&to){
                const message = await prisma.messages.create({
                    data:{
                        message:newfilename,
                        sender:{connect:{id:parseInt(from)}},
                        reciever:{connect:{id:parseInt(to)}},
                        type:"audio",


                    },
                })
                return res.status(201).json({status:true, message})
            }
            return res.status(400).send("from ,to is required");
        }
        return res.status(400).send("Audio is required");

    } catch (error) {
        next(error);
    }
};

export const getInitialContacts = async (req, res,next) => {
    
        const userId = parseInt(req.params.from);
        const prisma = GetPrismaInstance();

        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: userId,
                },
                include: {
                    sentMessages: {
                        include: {
                            reciever: true,
                            sender:true,
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                    recievedMessages: {
                        include: {
                            sender: true,
                            reciever:true
                        },
                        orderBy: {
                            createdAt: 'desc',
                        },
                    },
                },
            });
        
            const messages = [...user.sentMessages, ...user.recievedMessages];
            messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
            const users = new Map();
            const messageStatusChange = [];
            messages.forEach((msg) => {
                const isSender = msg.senderId === userId;
                const calculatedId = isSender ? msg.recieverId : msg.senderId;
                if (msg.messageStatus === "sent") {
                    messageStatusChange.push(msg.id);
                }
                if(!users.get(calculatedId)){
                    const {id,type,message,messageStatus,createdAt,senderId,recieverId} =msg;
                    let user ={
                        messageId: id,
                        type,message,messageStatus,createdAt,senderId,recieverId
                    }
                    if(isSender){
                        user ={
                            ...user,...msg.reciever,totalUnreadMessages:0,
                        }
                    }else{
                        user ={
                            ...user,...msg.sender,totalUnreadMessages:messageStatus !== "read"?1:0,
                        }
                    }
                    users.set(calculatedId,{...user});
                }else if(msg.messageStatus !=="read" && !isSender){
                    const user = users.get(calculatedId);
                    users.set(calculatedId, {
                        ...user,
                        totalUnreadMessages:user.totalUnreadMessages+1,
                    });
                } 
            });
        

        
            if (messageStatusChange.length) {
                await prisma.messages.updateMany({
                    where: {
                        id: {
                            in: messageStatusChange,
                        },
                    },
                    data: {
                        messageStatus: "delivered",
                    },
                });
            }
        
        console.log(users.values());
        return res.json({users:Array.from(users.values()),
        onlineUsers:Array.from(onlineUsers.keys())});
    } catch (error) {
        next(error);
    }
};