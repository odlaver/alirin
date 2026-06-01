import { useContext } from 'react'
import { AuthContext } from '../components/AuthContext.js'

export function useAuth() {
  return useContext(AuthContext)
}
