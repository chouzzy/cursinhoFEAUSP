import { Router } from "express"
import { CreateDonationController } from "../modules/donations/useCases/createDonation/CreateDonationController"
import { DeleteDonationController } from "../modules/donations/useCases/deleteDonation/DeleteDonationController"
import { ListDonationsController } from "../modules/donations/useCases/listDonations/ListDonationsController"
import { UpdateDonationController } from "../modules/donations/useCases/updateDonation/UpdateDonationController"
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"

const donationsRoutes = Router()

const listDonationsController = new ListDonationsController()
donationsRoutes.get('/', ensureAuthenticated, listDonationsController.handle)

const createDonationController = new CreateDonationController()
donationsRoutes.post('/create', createDonationController.handle)

const updateDonationController = new UpdateDonationController()
donationsRoutes.put('/:donationID/update', ensureAuthenticated, updateDonationController.handle)

const deleteDonationController = new DeleteDonationController()
donationsRoutes.delete('/:donationID/delete', ensureAuthenticated, deleteDonationController.handle)


export {donationsRoutes}