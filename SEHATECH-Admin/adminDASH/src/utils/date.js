import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatDate = (date) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
  } catch (error) {
    console.error('Invalid date:', date)
    return '-'
  }
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  try {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch (error) {
    console.error('Invalid date:', date)
    return '-'
  }
} 