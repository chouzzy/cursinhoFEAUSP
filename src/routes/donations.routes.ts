import { Router } from "express"
import { CreateDonationController } from "../modules/donations/useCases/createDonation/CreateDonationController"
import { DeleteDonationController } from "../modules/donations/useCases/deleteDonation/DeleteDonationController"
import { ListDonationsController } from "../modules/donations/useCases/listDonations/ListDonationsController"
import { UpdateDonationController } from "../modules/donations/useCases/updateDonation/UpdateDonationController"
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"
import { ExcelListDonationsController } from "../modules/donations/useCases/excelListDonations/ExcelListDonationsController"
import { RefundDonationController } from "../modules/donations/useCases/refundDonation/RefundDonationController"
import { ListChargesDonationController } from "../modules/donations/useCases/listChargesDonation/ListChargesDonationController"
import { SyncDonationsController } from "../modules/donations/useCases/syncDonations/SyncDonationsController"
import { CreatePixDonationController } from "../modules/donations/useCases/createPixDonation/CreatePixDonationController"

const donationsRoutes = Router()

const listDonationsController = new ListDonationsController()
donationsRoutes.get('/', ensureAuthenticated, listDonationsController.handle)

const excellistDonationsController = new ExcelListDonationsController()
donationsRoutes.get('/excel', ensureAuthenticated, excellistDonationsController.handle)

const createDonationController = new CreateDonationController()
donationsRoutes.post('/create', createDonationController.handle)

// PIX
const pixDonationController = new CreatePixDonationController()
donationsRoutes.post('/pix', pixDonationController.handle)

const updateDonationController = new UpdateDonationController()
donationsRoutes.put('/:donationID/update', ensureAuthenticated, updateDonationController.handle)

const deleteDonationController = new DeleteDonationController()
donationsRoutes.put('/:donationID/cancel', ensureAuthenticated, deleteDonationController.handle)

const refundDonationController = new RefundDonationController()
donationsRoutes.post('/:donationID/:chargeID/refund', ensureAuthenticated, refundDonationController.handle)

const listChargesDonationController = new ListChargesDonationController()
donationsRoutes.get('/:donationID/list', ensureAuthenticated, listChargesDonationController.handle)

const syncDonationController = new SyncDonationsController()
donationsRoutes.post('/sync', ensureAuthenticated, syncDonationController.handle)


export {donationsRoutes}