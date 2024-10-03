import { boolean, number, object, string } from "yup";
import * as Yup from "yup"

const donationSchema = object({
  name: string().required("O nome é obrigatório").min(2, "O nome precisa ter no mínimo duas letras"),
  email: string().required("O email é obrigatório").min(3, "O email precisa ter no mínimo três letras"),
  phoneNumber: string().required("O nome é obrigatório").min(10, "O número precisa ter ao mínimo 10 letras, contando DDD"),
  gender: string(),
  birth: string().required("A date de nascimento é obrigatória").min(10, "A date de nascimento precisa estar no formato XX/XX/XXXX"),
  isPhoneWhatsapp: boolean().required("Informe se o telefone também é Whatsapp"),
  state: string().required("O estado é obrigatório").min(2, "O estado deve possuir ao menos 2 letras"),
  city: string().required("A cidade é obrigatória").min(2, "A cidade deve possuir ao menos 2 letras"),
  street: string().required("A rua é obrigatória"),
  homeNumber: string().required("Número da residência obrigatório"),
  complement: string(),
  district: string().required("O bairro é obrigatório"),
  zipCode: string().required("O CEP é obrigatório").min(9, "O CEP deve conter 8 algarismos e um hífen. Ex: 08230-030"),

  cpf: string().length(11,'O CPF deve conter 11 caracteres'),
  
  rg: string().length(9, 'O RG deve conter 9 caracteres'),

  cnpj: string().length(14, 'O CNPJ deve conter 14 caracteres'),

  ufrg: string().oneOf([
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ]),
  paymentMethodID: string().required("O método de pagamento é necessário"),
  productSelectedID: string().required("O produto é obrigatório"),
  cycles: number().required("A quantidade de ciclos é necessária")
})

export { donationSchema }