class Admins {
    id!:        string
    name!:      string
    email!:     string
    username!:  string
    password!:  string
    refresh_token?: string
    createdAt!:  Date
    updatedAt?:  Date
  }

  export {Admins}