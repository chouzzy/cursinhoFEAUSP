import { validationResponse } from "../../../types"
import { Donations } from "../entities/Donations"
import { CreateDonationProps } from "../useCases/createDonation/CreateDonationController"
import { DeleteDonationProps } from "../useCases/deleteDonation/DeleteDonationController";
import { ListDonationsQuery } from "../useCases/listDonations/ListDonationsController";


interface IDonationsRepository {

    filterDonation(
        {name,
        email,
        cpf,
        paymentStatus,
        initValue,
        endValue,
        initDate,
        endDate
    }:ListDonationsQuery,
        page:number,
        pageRange:number
    ): Promise<validationResponse>

    createDonation(donationData: CreateDonationProps): Promise<validationResponse>;

    deleteDonation(donationID: Donations["id"], donationData: DeleteDonationProps): Promise<validationResponse>
}

export { IDonationsRepository }