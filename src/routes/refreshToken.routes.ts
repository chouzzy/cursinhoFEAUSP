import { Router } from "express"
import { ListAdminsController } from "../modules/registrations/useCases/Admins/listAdmins/ListAdminsController"
import { RefreshTokenController } from "../modules/registrations/useCases/refreshToken/RefreshTokenController"

const refreshTokenRoutes = Router()

const refreshTokenController = new RefreshTokenController()
refreshTokenRoutes.post('/', refreshTokenController.handle)


export {refreshTokenRoutes}