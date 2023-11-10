import { Prisma } from "@prisma/client";
import { SchoolClass } from "../modules/registrations/entities/SchoolClass";
import { Students, purcharsedSubscriptions } from "../modules/registrations/entities/Students";
import { Admins } from "../modules/registrations/entities/Admins";
import { Donations } from "../modules/donations/entities/Donations";
import Stripe from "stripe";


interface validationResponse {
  isValid: boolean;
  statusCode: number;
  isEmpty?: boolean;
  errorMessage?: string | string[] | Prisma.PrismaClientKnownRequestError;
  successMessage?: string;
  token?: string
  refreshToken?: unknown;
  stripeCreatedCustomerID?: string;
  stripeCreatedProductID?: string;
  schoolClass?: SchoolClass
  listAllSchoolClassList?: {
    id: SchoolClass['id'],
    title: SchoolClass['title']
  }[] 
  schoolClassList?: SchoolClass[]
  schoolClassDocs?: SchoolClass["documents"]
  schoolClassStages?: SchoolClass["selectiveStages"]
  students?: Students
  studentsList?: Students[]
  admins?: {
    id: Admins["id"]
    name: Admins["name"]
    email: Admins["email"]
    username: Admins["username"]
  }
  adminsList?: Admins[]
  adminSimplified?: {
    id: Admins["id"],
    name: Admins["name"],
    username: Admins["username"]
  }
  adminsListSimplified?: {
    id: Admins["id"],
    name: Admins["name"],
    username: Admins["username"]
  }[]
  donations?: Donations
  donationsList?: Donations[]
  fileBuffer?: ArrayBuffer
  totalDocuments?: number
  subscriptionsDuplicated?: purcharsedSubscriptions["schoolClassID"][]
  stripeSubscription?:Stripe.Response<Stripe.Subscription>
  charges?:Stripe.Response<Stripe.ApiSearchResult<Stripe.Charge>>
}

interface StripeCheckoutCustomerPropsDetails {
  address: {
    city: string,
    country: string,
    line1: string,
    line2?: string,
    postal_code: string,
    state: string
  },
  email: string,
  name: string,
  phone: string,
  tax_exempt?: string,
  tax_ids?: []
}

interface StripeCheckoutCustomerProps {

  metadata: {
    schoolClassID: string,
    productID: string,
    productName: string
  },
  customerDetails: StripeCheckoutCustomerPropsDetails
  paymentMethod: string
  paymentStatus: string
  amount: number
}

interface FromBackend {

  id: string,
  object: string,
  address: {
    city: string,
    country: string,
    line1: string,
    line2: string,
    postal_code: string,
    state: string
  },
  balance: number | unknown,
  created: number | unknown,
  currency: string | unknown,
  default_source: string | unknown,
  delinquent: boolean | unknown,
  description: string
  discount: string | null | unknown,
  email: string | unknown,
  invoice_prefix: string | null | unknown,
  invoice_settings: {
    custom_fields: string | null | unknown,
    default_payment_method: string | null | unknown,
    footer: string | null | unknown,
    rendering_options: string | null | unknown
  } | unknown,
  livemode: boolean | unknown,
  metadata: {} | unknown,
  name: string | unknown,
  next_invoice_sequence: number | unknown,
  phone: string | unknown,
  preferred_locales: [
    string
  ] | unknown,
  shipping: {
    address: {
      city: string | unknown,
      country: string | unknown,
      line1: string | unknown,
      line2: string | unknown,
      postal_code: string | unknown,
      state: string | unknown
    } | unknown,
    name: string | unknown,
    phone: string | unknown
  },
  tax_exempt: unknown,
  test_clock: string | null | unknown
}

interface CustomerSubscriptionCreated {
  id: string
  cancel_at: number
  current_period_end: number
  current_period_start: number
  customer: string
  default_source: string
  default_payment_method: string
  items: {
    data: [
      {
        price: {
          id: string
          active: boolean
          nickname: string
          product: string
          unit_amount: number
        }
        quantity: number
        subscription: string
      }
    ]
  }
  metadata: {
    subscriptionType: string,
    cpf: string,
    rg: string,
    stripeCustomerID: string,
    donationID: string
  }
  status: string,


}

interface ChargeRefundedProps {
  refunded: boolean,
  invoice: string,
  customerID: string
}

interface InvoiceRetrieveProps {
  customer: string,
  customer_email: string,
  subscription: string,
  lines: {
    data: [{
      price: {
        product: string
      },
      metadata: {
        cpf: string,
        rg: string,
        schoolClassID: string,
        stripeCustomerID: string,
        subscriptionType: string
      }
    }]
  }
}

interface StripeCreateProductProps {
  name: string,
  description: string,
  metadata: {
    schoolClassID: string,
    productType: string,
    title: string
    semester: string
    year: string
  }
  default_price_data: number
}

interface StripeDeactivatedProduct {
  id: string,
  object: string,
  active: boolean,
  created: number,
  default_price: null | unknown,
  description: string,
  images: unknown,
  livemode: boolean,
  metadata: unknown
  name: string,
  package_dimensions: null | unknown,
  shippable: null | unknown,
  statement_descriptor: null | unknown,
  tax_code: null | unknown,
  unit_label: null | unknown,
  updated: number,
  url: null | unknown
}

interface StripeCustomerData {
  name: string
  email: string
  phoneNumber: string
  gender?: string
  birth: string
  state: string
  city: string
  street: string
  cpf: string | null
  cnpj?: string | null
  rg?: string | null
  ufrg: string
}

export {
  validationResponse,
  StripeCheckoutCustomerPropsDetails,
  StripeCheckoutCustomerProps,
  FromBackend,
  CustomerSubscriptionCreated,
  ChargeRefundedProps,
  StripeCreateProductProps,
  StripeDeactivatedProduct,
  StripeCustomerData,
  InvoiceRetrieveProps
}