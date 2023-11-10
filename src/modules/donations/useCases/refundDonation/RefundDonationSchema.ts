import { object, string } from "yup";
const refundDonationSchema = object({
  donationID: string().required("ID da doação não informado."),
  chargeID: string().required("ID da cobrança não informado.")
})

export { refundDonationSchema }