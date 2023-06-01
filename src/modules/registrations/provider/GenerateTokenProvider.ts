import { sign } from "jsonwebtoken"
import { validationResponse } from "../../../types"
import { Admins } from "../entities/Admins"


class GenerateTokenProvider {

    async execute(adminID: Admins["id"], adminName: Admins['name'], adminEmail: Admins['email']): Promise<validationResponse["token"]> {

        const privateKey = process.env.TOKEN_PRIVATE_KEY
        const payload = JSON.stringify({
            id: adminID,
            name: adminName,
            adminEmail: adminEmail
        })
        const token = sign({payload}, privateKey?privateKey:'', {
            
            subject: adminID,
            expiresIn: "20s"
        })

        return token
    }
}

export { GenerateTokenProvider }