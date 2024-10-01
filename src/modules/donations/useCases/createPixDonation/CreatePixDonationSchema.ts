import { boolean, number, object, string } from "yup";
import * as Yup from "yup"

const createPixDonationSchema = object({
  name: string().required("O nome é obrigatório").min(2, "O nome precisa ter no mínimo duas letras"),

  email: string().required("O email é obrigatório").min(3, "O email precisa ter no mínimo três letras"),

  phoneNumber: string().required("O nome é obrigatório").min(10, "O número precisa ter ao mínimo 10 letras, contando DDD"),

  isPhoneWhatsapp: boolean().required("Informe se o telefone também é Whatsapp"),

  gender: string(),

  birth: string().required("A date de nascimento é obrigatória").min(10, "A date de nascimento precisa estar no formato XX/XX/XXXX"),

  state: string().required("O estado é obrigatório").min(2, "O estado deve possuir ao menos 2 letras"),

  city: string().required("A cidade é obrigatória").min(2, "A cidade deve possuir ao menos 2 letras"),

  street: string().required("A rua é obrigatória"),

  homeNumber: string().required("Número da residência obrigatório"),

  complement: string(),

  district: string().required("O bairro é obrigatório"),

  zipCode: string().required("O CEP é obrigatório").min(9, "O CEP deve conter 8 algarismos e um hífen. Ex: 08230-030"),


  cpf: string().test('cpf-validation', 'O CPF deve conter 11 caracteres ou "Não informado"', (value) => {
    // Check if the value is either "Não informado" or a string with length 11
    return value === "Não informado" || (typeof value === "string" && value.length === 11);
  }),

  rg: string().test('cpf-validation', 'O RG deve conter 9 caracteres ou "Não informado"', (value) => {
    // Check if the value is either "Não informado" or a string with length 11
    return value === "Não informado" || (typeof value === "string" && value.length >= 9);
  }),

  cnpj: string().test('cpf-validation', 'O CNPJ deve conter 14 caracteres ou "Não informado"', (value) => {
    // Check if the value is either "Não informado" or a string with length 11
    return value === "Não informado" || (typeof value === "string" && value.length === 14);
  }),

  ufrg: string().required("O estado de emissão do RG é obrigatório.").oneOf(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO', 'Não informado'
  ]),

  valuePaid: number().required("É necessário indicar o valor da doação"),
  
  productSelectedID: string().required("O produto é obrigatório")

})

export { createPixDonationSchema }