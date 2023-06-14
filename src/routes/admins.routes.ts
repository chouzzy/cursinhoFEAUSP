import { Router } from "express"
import { AuthenticateAdminsController } from "../modules/registrations/useCases/Admins/authenticateAdmin/AuthenticateAdminController"
import { CreateAdminsController } from "../modules/registrations/useCases/Admins/createAdmins/CreateAdminController"
import { DeleteAdminController } from "../modules/registrations/useCases/Admins/deleteAdmins/DeleteAdminController"
import { ListAdminsController } from "../modules/registrations/useCases/Admins/listAdmins/ListAdminsController"
import { UpdateAdminsController } from "../modules/registrations/useCases/Admins/updateAdmins/UpdateAdminsController"
import { UpdateAdminsPasswordController } from "../modules/registrations/useCases/Admins/updateAdminsPassword/UpdateAdminsPasswordController"
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"

const adminsRoutes = Router()

const listAdminsController = new ListAdminsController()
adminsRoutes.get('/', ensureAuthenticated, listAdminsController.handle)

const createAdminsController = new CreateAdminsController()
adminsRoutes.post('/create', ensureAuthenticated, createAdminsController.handle)

const updateAdminsController = new UpdateAdminsController()
adminsRoutes.put('/:adminID/update', ensureAuthenticated, updateAdminsController.handle)

const updateAdminsPasswordController = new UpdateAdminsPasswordController()
adminsRoutes.put('/:adminID/updatePassword', ensureAuthenticated, updateAdminsPasswordController.handle)

const deleteAdminsController = new DeleteAdminController()
adminsRoutes.delete('/:adminID/delete', ensureAuthenticated, deleteAdminsController.handle)

const authenticateAdminsController = new AuthenticateAdminsController()
adminsRoutes.post('/login', authenticateAdminsController.handle)


export {adminsRoutes}