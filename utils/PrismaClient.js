import {PrismaClient} from "@prisma/client"


let PrismaInstance = null;

function GetPrismaInstance(){
    if(!PrismaInstance){
        PrismaInstance = new PrismaClient({
            errorFormat:"pretty"
        });
    }
    return PrismaInstance;

}
export default GetPrismaInstance;