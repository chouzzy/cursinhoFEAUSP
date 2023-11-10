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

const welcomeRoutes = Router()

welcomeRoutes.get('/', async (req, res) => {
    return res.sendStatus(200).send('seja bem vindo meu principe 🦥')
})


export {welcomeRoutes}