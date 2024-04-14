import GetPrismaInstance from "../utils/PrismaClient.js";
import { generateToken04 } from "../utils/TokenGenerator.js";


export const CheckUser = async(req,res,next) => {
    const {email} = req.body;
    try {
        if (!email){
            return res.json({message:"Email is required",status:false});
        }
        const prisma =GetPrismaInstance();
        const user = await prisma.user.findUnique({where:{email}});
        if (!user){
            return res.json({message:"User does not exist",status:false});
        }
        return res.json({message:"user login",status:true,data:user});

    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const onBoardUser = async(req,res,next) => {
    try {
        const {name,image:profilePicture,about,email} = req.body;
        if(!name||!profilePicture||!email){
            return res.json({msg:"email name and profilepicture required"})
        }
        const prisma = GetPrismaInstance();
        const user ={
            name,
            email,
            profilePicture,
            about, 
          }
        const newUser = await prisma.user.create({
            data: user,
          });
          
        
        return res.json({msg:"login successfully ",status:true,data:newUser});
    } catch (error) {
        next(error);
    } 
};


export const getAllusers = async(req, res,next) =>{
        try {
            const prisma = GetPrismaInstance();
            const users = await prisma?.user.findMany({
                orderBy:{
                    name:"asc"
                },
                select:{
                    id:true,
                    name:true,
                    about:true,
                    email:true,
                    profilePicture:true,
                }
            });
            const usergroupedByInititalLetters = {};
            users.forEach(user =>{
                const initialletter = user.name.charAt(0).toUpperCase();
                if(!usergroupedByInititalLetters[initialletter]){
                    usergroupedByInititalLetters[initialletter] =[];
                }
                usergroupedByInititalLetters[initialletter].push(user);
            })

            return res.status(200).json({users: usergroupedByInititalLetters,status:true})

        } catch (error) {
            next(error);
        }  
}


export const generateToken = async(req,res,next)=>{


    try {
        const { NEXT_PUBLIC_ZEGO_APP_ID, NEXT_PUBLIC_ZEGO_SERVER_ID } = process.env;
        const { userId } = req.params;
        const Effectivetime = 3600;
        const payload = ""; 

        if (NEXT_PUBLIC_ZEGO_APP_ID && NEXT_PUBLIC_ZEGO_SERVER_ID && userId) {
            // console.log(typeof(NEXT_PUBLIC_ZEGO_SERVER_ID),NEXT_PUBLIC_ZEGO_SERVER_ID.length);
            const Secret = 'f9b1aae3aba8b707f737d11684c32b12';
            const Token = generateToken04(parseInt(NEXT_PUBLIC_ZEGO_APP_ID), userId, Secret, Effectivetime, payload);
            
            return res.status(200).json({ Token });
        } else {
            return res.status(400).send("Invalid app id, user id, or server");
        }
    } catch (error) {
        console.error(error);
        next(error);
    }

}

