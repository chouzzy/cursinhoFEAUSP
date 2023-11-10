import { boolean, number, object, string } from "yup";

const listChargesDonationSchema = object({
  donationID: string().required("ID da doação não informado.")
})

export { listChargesDonationSchema }