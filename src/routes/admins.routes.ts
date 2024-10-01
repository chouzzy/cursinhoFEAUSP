import express, { Router } from "express"

import { AuthenticateAdminsController } from "../modules/registrations/useCases/Admins/authenticateAdmin/AuthenticateAdminController"
import { CreateAdminsController } from "../modules/registrations/useCases/Admins/createAdmins/CreateAdminController"
import { DeleteAdminController } from "../modules/registrations/useCases/Admins/deleteAdmins/DeleteAdminController"
import { ListAdminsController } from "../modules/registrations/useCases/Admins/listAdmins/ListAdminsController"
import { UpdateAdminsController } from "../modules/registrations/useCases/Admins/updateAdmins/UpdateAdminsController"
import { UpdateAdminsPasswordController } from "../modules/registrations/useCases/Admins/updateAdminsPassword/UpdateAdminsPasswordController"
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"

const adminsRoutes = Router()

const listAdminsController = new ListAdminsController()
adminsRoutes.get('/', express.json(), ensureAuthenticated, listAdminsController.handle)

const createAdminsController = new CreateAdminsController()
adminsRoutes.post('/create', express.json(), ensureAuthenticated, createAdminsController.handle)

const updateAdminsController = new UpdateAdminsController()
adminsRoutes.put('/:adminID/update', express.json(), ensureAuthenticated, updateAdminsController.handle)

const updateAdminsPasswordController = new UpdateAdminsPasswordController()
adminsRoutes.put('/:adminID/updatePassword', express.json(), ensureAuthenticated, updateAdminsPasswordController.handle)

const deleteAdminsController = new DeleteAdminController()
adminsRoutes.delete('/:adminID/delete', express.json(), ensureAuthenticated, deleteAdminsController.handle)

const authenticateAdminsController = new AuthenticateAdminsController()
adminsRoutes.post('/login', express.json(), authenticateAdminsController.handle)


export {adminsRoutes}