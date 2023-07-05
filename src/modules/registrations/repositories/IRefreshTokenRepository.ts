import { validationResponse } from "../../../types";
import { Admins } from "../entities/Admins";
import { RefreshToken } from "../entities/RefreshToken";
import { RefreshTokenRequestProps } from "../useCases/refreshToken/RefreshTokenController";


interface IRefreshTokenRepository {

    refreshTokenValidation(refreshToken: RefreshTokenRequestProps): Promise<validationResponse>
}

export {IRefreshTokenRepository}