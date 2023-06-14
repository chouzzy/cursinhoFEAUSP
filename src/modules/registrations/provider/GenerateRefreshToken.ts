import dayjs from "dayjs";
import { prisma } from "../../../prisma";
import { RefreshToken } from "../entities/RefreshToken";


class GenerateRefreshToken {

    async execute(adminID: RefreshToken["adminID"]): Promise<RefreshToken> {

        const expTimeNumber = Number(process.env.REFRESHTOKEN_EXPIRATION_TIME_NUMBER)
        // const expTimeUnit = process.env.REFRESHTOKEN_EXPIRATION_TIME_UNIT

        const expires_at = dayjs().add(expTimeNumber, 'days').unix();

        const generateRefreshToken = await prisma.refreshToken.create({
            data: {
                adminID,
                expires_at
            }
        })

        return generateRefreshToken
    }
}

export { GenerateRefreshToken }