import { createContext } from 'react'

export const AuthContext = createContext({
  session: null,
  user: null,
  role: null,
  loading: true,
})
