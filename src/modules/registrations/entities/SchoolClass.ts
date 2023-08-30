
class SchoolClass {

  id!: string
  title!: string
  informations!: SchoolClassInformations
  subscriptions!: SchoolClassSubscriptionInformations
  selectiveStages!: SchoolClassSelectiveStages[]
  stripeProductID!: string
  status!: string
  documents?: DocumentsTypes[]
}

interface SchoolClassInformations {
  description: string
  whoCanParticipate: string
  observations: string | null
  classContent: string
  dateSchedule: string
  hourSchedule: string
  color: string
}

interface DocumentsTypes {
  docsID: string
  title: string
  downloadLink: string
}


interface SchoolClassSubscriptionInformations {
  status: string
  price: number
  subscriptionSchedule: string
}

interface SchoolClassSelectiveStages {
  stagesID: string
  when: string
  resultsDate: Date | null
  description: string
}

export { SchoolClass, DocumentsTypes, SchoolClassSelectiveStages }