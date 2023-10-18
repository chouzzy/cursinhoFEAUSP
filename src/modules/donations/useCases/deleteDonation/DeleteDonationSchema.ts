import { number, object, string } from "yup";

const donationSchema = object({
    donationID: string().required("O id da doação é obrigatório")
    
})

export {donationSchema}