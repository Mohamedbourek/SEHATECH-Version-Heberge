/**
 * Utilitaires de formatage de date sans dépendance directe à la localisation fr de date-fns
 */

/**
 * Formater une date selon le format français
 * @param {Date|string} dateString - Date à formater
 * @param {Object} options - Options de formatage Intl.DateTimeFormat
 * @returns {string} Date formatée
 */
export function formatDate(dateString, options = {}) {
  const date = new Date(dateString)
  const defaultOptions = { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Intl.DateTimeFormat('fr-FR', {...defaultOptions, ...options}).format(date)
}

/**
 * Formater l'heure seulement
 * @param {string} time - Heure au format HH:MM ou chaîne de date
 * @returns {string} Heure formatée
 */
export function formatTime(time) {
  try {
    // Si time est déjà au format hh:mm
    if (typeof time === 'string' && time.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes)
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Si time est une chaîne de date
    if (typeof time === 'string') {
      const date = new Date(time)
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    return time
  } catch (error) {
    console.error('Erreur formatage de l\'heure:', error)
    return time
  }
}

/**
 * Formater une date relative (il y a X temps)
 * @param {Date|string} date - Date à comparer
 * @returns {string} Description relative
 */
export function formatRelative(date) {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now - then
  
  // Convertir en secondes, minutes, heures, jours
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)
  
  if (diffSec < 60) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`
  if (diffHrs < 24) return `il y a ${diffHrs} heure${diffHrs > 1 ? 's' : ''}`
  if (diffDays < 30) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
  
  // Pour les dates plus anciennes, utiliser le format standard
  return formatDate(date)
}
