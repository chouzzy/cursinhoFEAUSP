import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";


function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
    
    const authToken = req.headers.authorization
    
    if (!authToken) {
        return res.status(401).json({
            message:'Nenhum header token foi enviado'
        })
    }

    const [,token] = authToken.split(" ")


    if (!token) {
        return res.status(401).json({
            message:'Token is missing'
        })
    }

    try {
        const privateKey = process.env.TOKEN_PRIVATE_KEY
        verify(token, privateKey?privateKey:'')
        return next()

    } catch (error) {
        return res.status(401).json({
            message:'Token is invalid'
        })
    }
}

export {ensureAuthenticated}