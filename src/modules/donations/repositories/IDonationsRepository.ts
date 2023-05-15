import { validationResponse } from "../../../types"
import { Donations } from "../entities/Donations"
import { CreateDonationProps } from "../useCases/createDonation/CreateDonationController"
import { DeleteDonationProps } from "../useCases/deleteDonation/DeleteDonationController";


interface IDonationsRepository {

    filterByValueEmailandDate(
        initValue:number,
        endValue:number,
        email:string,
        date:string,
        actualPage:number
    ): Promise<Donations[]>

    createDonation(donationData: CreateDonationProps): Promise<Donations|validationResponse>;

    deleteDonation(donationID: Donations["id"], donationData: DeleteDonationProps): Promise<Donations| validationResponse>
}

export {IDonationsRepository}