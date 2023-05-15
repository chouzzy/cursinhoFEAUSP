import { Router } from "express"
import { CreateDonationController } from "../modules/donations/useCases/createDonation/CreateDonationController"
import { DeleteDonationController } from "../modules/donations/useCases/deleteDonation/DeleteDonationController"
import { ListDonationsController } from "../modules/donations/useCases/listDonations/ListDonationsController"
import { UpdateDonationController } from "../modules/donations/useCases/updateDonation/UpdateDonationController"

const donationsRoutes = Router()

const listDonationsController = new ListDonationsController()
donationsRoutes.get('/', listDonationsController.handle)

const createDonationController = new CreateDonationController()
donationsRoutes.post('/create', createDonationController.handle)

const updateDonationController = new UpdateDonationController()
donationsRoutes.put('/:donationID/update', updateDonationController.handle)

const deleteDonationController = new DeleteDonationController()
donationsRoutes.delete('/:donationID/delete', deleteDonationController.handle)


export {donationsRoutes}