import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

// Fonction utilitaire pour formater la date
const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: fr })
}

// Fonction pour générer le PDF d'une prescription
export const generatePrescriptionPDF = async (data, preview = false) => {
  const doc = new jsPDF()
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Ordonnance', 105, 20, { align: 'center' })
  
  // Informations du médecin
  doc.setFontSize(12)
  doc.text('Dr. ' + data.nomMedecin, 20, 40)
  doc.setFontSize(10)
  doc.text('Médecin généraliste', 20, 45)
  doc.text('N° RPPS: ' + data.rpps, 20, 50)
  
  // Date
  doc.setFontSize(10)
  doc.text('Date: ' + format(new Date(), 'dd/MM/yyyy', { locale: fr }), 150, 40)
  
  // Informations du patient
  doc.setFontSize(12)
  doc.text('Patient:', 20, 70)
  doc.setFontSize(10)
  doc.text(data.patientName, 20, 75)
  
  // Médicaments
  doc.autoTable({
    startY: 90,
    head: [['Médicament', 'Posologie', 'Durée', 'Instructions']],
    body: data.medicaments.map(med => [
      med.nomCommercial,
      med.posologie,
      med.duree || '-',
      med.instructions || '-'
    ]),
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }
  })
  
  // Notes pour le pharmacien
  if (data.pharmacistNotes) {
    const finalY = doc.lastAutoTable.finalY || 150
    doc.setFontSize(10)
    doc.text('Notes pour le pharmacien:', 20, finalY + 10)
    doc.text(data.pharmacistNotes, 20, finalY + 15)
  }
  
  // Options
  const finalY = doc.lastAutoTable.finalY || 150
  if (data.renouvelable || data.urgent || data.nonSubstituable) {
    doc.setFontSize(10)
    doc.text('Options:', 20, finalY + 30)
    let y = finalY + 35
    if (data.renouvelable) doc.text('☑ Ordonnance renouvelable', 20, y += 5)
    if (data.urgent) doc.text('☑ Urgent', 20, y += 5)
    if (data.nonSubstituable) doc.text('☑ Non substituable', 20, y += 5)
  }
  
  // Signature
  doc.setFontSize(10)
  doc.text('Signature:', 150, finalY + 50)
  
  if (preview) {
    // Retourner le blob pour la prévisualisation
    return doc.output('blob')
  } else {
    // Retourner le blob pour l'impression
    return doc.output('blob')
  }
}

export const generateOrdonnacePDF = async (data, preview = false) => {
  const doc = new jsPDF()
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Ordonnance', 105, 20, { align: 'center' })
  
  // Date d'émission
  doc.setFontSize(10)
  const dateText = data.dateEmission 
    ? format(new Date(data.dateEmission), 'dd/MM/yyyy', { locale: fr })
    : format(new Date(), 'dd/MM/yyyy', { locale: fr })
  doc.text('Date: ' + dateText, 150, 40)
  
  // Statut
  if (data.statut) {
    doc.setFontSize(12)
    let statusColor = [0, 0, 0] // Noir par défaut
    if (data.statut === 'active') statusColor = [0, 128, 0] // Vert
    if (data.statut === 'terminée') statusColor = [128, 128, 128] // Gris
    if (data.statut === 'annulee') statusColor = [255, 0, 0] // Rouge
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    doc.text('Statut: ' + data.statut, 20, 30)
    doc.setTextColor(0, 0, 0) // Réinitialiser la couleur
  }
  
  // Médicaments
  if (data.medicaments && data.medicaments.length > 0) {
    doc.autoTable({
      startY: 60,
      head: [['Médicament', 'Posologie', 'Durée', 'Instructions']],
      body: data.medicaments.map(med => [
        med.medicament.nomCommercial || med.medicament.nomGenerique || 'Non spécifié',
        med.posologie || '-',
        med.duree || '-',
        med.instructions || '-'
      ]),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] }
    })
  } else {
    doc.setFontSize(12)
    doc.text('Aucun médicament prescrit', 105, 100, { align: 'center' })
  }
  
  // Options
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 120
  if (data.renouvelable) {
    doc.setFontSize(10)
    doc.text('☑ Ordonnance renouvelable', 20, finalY)
  }
  
  // Pied de page
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(10)
  doc.text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 105, pageHeight - 20, { align: 'center' })
  doc.text('Ce document est une génération locale et peut ne pas contenir toutes les informations officielles.', 105, pageHeight - 15, { align: 'center' })
  
  // Signature
  doc.text('Signature du médecin:', 20, pageHeight - 30)
  doc.line(20, pageHeight - 25, 80, pageHeight - 25)
  
  if (preview) {
    const blob = doc.output('blob')
    return URL.createObjectURL(blob)
  } else {
    return doc.output('blob')
  }
}

// Fonction pour générer le PDF d'un examen
export const generateExamenPDF = async (data, preview = false) => {
  const doc = new jsPDF()
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Demande d\'examen', 105, 20, { align: 'center' })
  
  // Informations de l'examen
  doc.setFontSize(12)
  doc.text('Type d\'examen: ' + data.typeExamen, 20, 40)
  doc.text('Date prévue: ' + formatDate(data.datePrevue), 20, 50)
  
  // Description
  doc.setFontSize(10)
  doc.text('Description:', 20, 70)
  doc.text(data.description, 20, 75)
  
  // Instructions
  if (data.instructions) {
    doc.text('Instructions:', 20, 95)
    doc.text(data.instructions, 20, 100)
  }
  
  // Options
  doc.setFontSize(10)
  const options = []
  if (data.urgent) options.push('URGENT')
  if (data.aJeun) options.push('À jeun')
  if (data.hospitalisation) options.push('Hospitalisation requise')
  
  if (options.length > 0) {
    doc.text('Options:', 20, 120)
    options.forEach((opt, index) => {
      doc.text('- ' + opt, 30, 125 + (index * 5))
    })
  }
  
  if (preview) {
    return doc.output('blob')
  } else {
    return doc.output('blob')
  }
}

// Fonction pour générer le PDF d'un rapport
export const generateRapportPDF = async (data, preview = false) => {
  const doc = new jsPDF()
  
  // Récupérer la date formatée
  const dateFormatee = data.date ? format(new Date(data.date), 'dd/MM/yyyy', { locale: fr }) : format(new Date(), 'dd/MM/yyyy', { locale: fr });
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Rapport médical', 105, 20, { align: 'center' })
  
  // Date
  doc.setFontSize(10)
  doc.text(`Date: ${dateFormatee}`, 150, 30, { align: 'right' })
  
  // Type de rapport et titre
  doc.setFontSize(14)
  doc.text(data.titre || 'Rapport médical', 20, 40)
  doc.setFontSize(10)
  doc.text('Type: ' + formatRapportType(data.type || 'consultation'), 20, 50)
  
  // Ligne de séparation
  doc.setLineWidth(0.1);
  doc.line(20, 55, 190, 55);
  
  // Contenu
  doc.setFontSize(12)
  doc.text('Contenu du rapport:', 20, 65)
  doc.setFontSize(10)
  
  const splitContent = doc.splitTextToSize(data.contenu || 'Aucun contenu disponible.', 170)
  doc.text(splitContent, 20, 75)
  
  // Pied de page
  const yPosition = doc.internal.pageSize.height - 20;
  doc.setFontSize(8)
  doc.text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 105, yPosition, { align: 'center' })
  doc.text('Ce document est une génération locale et peut ne pas contenir toutes les informations officielles.', 105, yPosition + 5, { align: 'center' })
  
  if (preview) {
    return doc.output('blob')
  } else {
    return doc.output('blob')
  }
}

// Fonction pour générer le PDF d'un billet de salle
export const generateBilletSallePDF = async (data, preview = false) => {
  const doc = new jsPDF()
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Billet de salle', 105, 20, { align: 'center' })
  
  // Informations du patient
  doc.setFontSize(12)
  doc.text('Patient:', 20, 40)
  doc.setFontSize(10)
  doc.text(`${data.nom} ${data.prenom}`, 20, 45)
  doc.text(`Date de naissance: ${formatDate(data.dateNaissance)}`, 20, 50)
  doc.text(`N° Sécurité sociale: ${data.numeroSecu}`, 20, 55)
  
  // Informations d'admission
  doc.setFontSize(12)
  doc.text('Admission:', 20, 70)
  doc.setFontSize(10)
  doc.text(`Service: ${data.service}`, 20, 75)
  doc.text(`Date d'admission: ${formatDate(data.dateAdmission)}`, 20, 80)
  doc.text(`Niveau d'urgence: ${data.niveauUrgence}`, 20, 85)
  
  // Motif et observations
  doc.setFontSize(12)
  doc.text('Motif:', 20, 100)
  doc.setFontSize(10)
  const splitMotif = doc.splitTextToSize(data.motif, 170)
  doc.text(splitMotif, 20, 105)
  
  if (data.observations) {
    doc.setFontSize(12)
    doc.text('Observations:', 20, 130)
    doc.setFontSize(10)
    const splitObs = doc.splitTextToSize(data.observations, 170)
    doc.text(splitObs, 20, 135)
  }
  
  if (preview) {
    return doc.output('blob')
  } else {
    return doc.output('blob')
  }
}

// Fonction pour générer le PDF d'une consultation
export const generateConsultationPDF = async (consultation, isPreview = false) => {
  const doc = new jsPDF()
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Consultation Médicale', 105, 20, { align: 'center' })
  
  // Date et motif
  doc.setFontSize(12)
  doc.text('Date:', 20, 40)
  doc.text(format(new Date(), 'dd/MM/yyyy', { locale: fr }), 80, 40)
  
  doc.text('Motif:', 20, 50)
  doc.text(consultation.motifConsultation, 80, 50)
  
  if (consultation.debutSymptomes) {
    doc.text('Début des symptômes:', 20, 60)
    doc.text(format(new Date(consultation.debutSymptomes), 'dd/MM/yyyy', { locale: fr }), 80, 60)
  }
  
  // Symptômes
  let yPos = 70
  if (consultation.symptomes && consultation.symptomes.length > 0) {
    doc.text('Symptômes:', 20, yPos)
    consultation.symptomes.forEach((symptome, index) => {
      if (symptome.trim()) {
        doc.text(`• ${symptome}`, 30, yPos + 10 + (index * 7))
      }
    })
    yPos = yPos + 10 + (consultation.symptomes.length * 7)
  }
  
  // Constantes vitales
  yPos += 10
  doc.text('Constantes vitales:', 20, yPos)
  const constantes = consultation.constantes
  if (constantes) {
    if (constantes.tension) doc.text(`Tension: ${constantes.tension}`, 30, yPos + 10)
    if (constantes.frequenceCardiaque) doc.text(`Fréq. cardiaque: ${constantes.frequenceCardiaque} bpm`, 30, yPos + 17)
    if (constantes.temperature) doc.text(`Température: ${constantes.temperature}°C`, 30, yPos + 24)
    if (constantes.saturation) doc.text(`Saturation O2: ${constantes.saturation}%`, 30, yPos + 31)
    yPos += 40
  }
  
  // Observations et diagnostic
  if (consultation.observations) {
    doc.text('Observations:', 20, yPos)
    const obsLines = doc.splitTextToSize(consultation.observations, 170)
    doc.text(obsLines, 20, yPos + 10)
    yPos += 10 + (obsLines.length * 7)
  }
  
  yPos += 10
  doc.text('Diagnostic:', 20, yPos)
  const diagLines = doc.splitTextToSize(consultation.diagnostic, 170)
  doc.text(diagLines, 20, yPos + 10)
  yPos += 10 + (diagLines.length * 7)
  
  if (consultation.conduiteTenir) {
    yPos += 10
    doc.text('Conduite à tenir:', 20, yPos)
    const conduiteLines = doc.splitTextToSize(consultation.conduiteTenir, 170)
    doc.text(conduiteLines, 20, yPos + 10)
  }
  
  // Pied de page
  doc.setFontSize(10)
  doc.text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 105, 280, { align: 'center' })
  
  return doc.output('blob')
}

// Fonction utilitaire pour le type d'examen
function formatExamenType(type) {
  const types = {
    'biologie': 'Examen biologique',
    'imagerie': 'Imagerie médicale',
    'cardiologie': 'Examen cardiologique',
    'neurologie': 'Examen neurologique'
  }
  return types[type] || type
}

// Fonctions utilitaires
function formatRapportType(type) {
  const types = {
    'suivi': 'Rapport de suivi',
    'hospitalisation': 'Rapport d\'hospitalisation',
    'intervention': 'Rapport d\'intervention',
    'examen': 'Rapport d\'examen'
  }
  return types[type] || type
}

function formatConfidentialite(niveau) {
  const niveaux = {
    'normal': 'Normal',
    'restreint': 'Restreint',
    'confidentiel': 'Confidentiel'
  }
  return niveaux[niveau] || niveau
}

// Fonction pour générer le PDF d'un schéma de traitement
export const generateSchemaPDF = async (data, preview = false) => {
  const doc = new jsPDF()
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Schéma de traitement', 105, 20, { align: 'center' })
  
  // Informations du document
  doc.setFontSize(16)
  doc.text(data.titre || 'Schéma de traitement', 105, 35, { align: 'center' })
  
  // Date de génération
  doc.setFontSize(10)
  doc.text(`Document généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 190, 30, { align: 'right' })
  
  // Ligne de séparation
  doc.setLineWidth(0.1)
  doc.line(20, 40, 190, 40)
  
  // Informations sur la période
  doc.setFontSize(12)
  doc.text('Période de traitement:', 20, 50)
  try {
    const dateDebut = data.date_debut ? format(new Date(data.date_debut), 'dd/MM/yyyy', { locale: fr }) : 'Non spécifiée'
    const dateFin = data.date_fin ? format(new Date(data.date_fin), 'dd/MM/yyyy', { locale: fr }) : 'Non spécifiée'
    doc.setFontSize(11)
    doc.text(`Du ${dateDebut} au ${dateFin}`, 20, 56)
  } catch (e) {
    console.error('Erreur lors du formatage des dates:', e)
    doc.text('Dates invalides ou non spécifiées', 20, 56)
  }
  
  // Statut du traitement
  if (data.statut) {
    doc.setFontSize(12)
    doc.text('Statut:', 120, 50)
    
    // Couleur différente selon le statut
    let statusColor = [0, 0, 0] // Noir par défaut
    if (data.statut === 'actif') statusColor = [0, 128, 0] // Vert
    if (data.statut === 'suspendu') statusColor = [255, 165, 0] // Orange
    if (data.statut === 'terminé') statusColor = [128, 128, 128] // Gris
    if (data.statut === 'annulé') statusColor = [255, 0, 0] // Rouge
    
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    doc.setFontSize(11)
    doc.text(data.statut.charAt(0).toUpperCase() + data.statut.slice(1), 120, 56)
    doc.setTextColor(0, 0, 0) // Réinitialiser la couleur
  }
  
  // Description ou observations
  if (data.description || data.observations) {
    doc.setFontSize(12)
    doc.text('Description:', 20, 70)
    
    const description = data.description || data.observations || ''
    const splitDescription = doc.splitTextToSize(description, 170)
    
    doc.setFontSize(10)
    doc.text(splitDescription, 20, 76)
  }
  
  // Médicaments
  const medications = data.medications || data.medicaments || []
  if (medications && medications.length > 0) {
    const yPosition = data.description || data.observations 
      ? 76 + (doc.splitTextToSize(data.description || data.observations || '', 170).length * 5) + 10 
      : 70
    
    doc.setFontSize(12)
    doc.text('Médicaments:', 20, yPosition)
    
    const tableColumns = ['Nom', 'Posologie', 'Voie', 'Durée', 'Instructions']
    const tableData = medications.map(med => [
      med.nom || med.nomCommercial || 'N/A',
      med.posologie || 'N/A',
      med.voie || 'N/A',
      med.duree || 'N/A',
      med.instructions || ''
    ])
    
    doc.autoTable({
      startY: yPosition + 5,
      head: [tableColumns],
      body: tableData,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 40 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 'auto' }
      }
    })
  }
  
  // Instructions spéciales
  if (data.instructions) {
    const yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 120
    doc.setFontSize(12)
    doc.text('Instructions spéciales:', 20, yPos)
    
    const splitInstructions = doc.splitTextToSize(data.instructions, 170)
    doc.setFontSize(10)
    doc.text(splitInstructions, 20, yPos + 6)
  }
  
  // Annotations ou commentaires
  if (data.commentaires && data.commentaires.length > 0) {
    let yPos = doc.lastAutoTable 
      ? doc.lastAutoTable.finalY + 15 
      : (data.instructions ? 120 + (doc.splitTextToSize(data.instructions, 170).length * 5) + 10 : 120)
    
    doc.setFontSize(12)
    doc.text('Commentaires:', 20, yPos)
    
    doc.setFontSize(10)
    data.commentaires.forEach((commentaire, index) => {
      const date = commentaire.date 
        ? format(new Date(commentaire.date), 'dd/MM/yyyy', { locale: fr }) 
        : 'Date inconnue'
      
      const auteur = commentaire.auteur || 'Médecin'
      const texte = commentaire.texte || commentaire.contenu || ''
      
      doc.setFontStyle('bold')
      doc.text(`${date} - ${auteur}:`, 20, yPos + 6 + (index * 15))
      doc.setFontStyle('normal')
      
      const splitCommentaire = doc.splitTextToSize(texte, 170)
      doc.text(splitCommentaire, 20, yPos + 11 + (index * 15))
    })
  }
  
  // Pied de page
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(10)
  doc.text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 105, pageHeight - 20, { align: 'center' })
  doc.text('Ce document est confidentiel et réservé à l\'usage médical.', 105, pageHeight - 15, { align: 'center' })
  
  // Signature
  doc.text('Signature du médecin:', 20, pageHeight - 30)
  doc.line(20, pageHeight - 25, 80, pageHeight - 25)

  if (preview) {
    // Retourner le blob pour la prévisualisation
    return doc.output('blob')
  } else {
    // Retourner le blob pour l'impression ou le téléchargement
    return doc.output('blob')
  }
}

// Fonction pour générer le PDF d'un certificat médical
export const generateCertificatPDF = async (data, preview = false) => {
  const doc = new jsPDF()
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Certificat médical', 105, 20, { align: 'center' })
  
  // Date du certificat
  doc.setFontSize(10)
  doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 150, 30)
  
  // Bordure et séparateur en haut
  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.1)
  doc.line(20, 35, 190, 35)
  
  // Informations du patient
  doc.setFontSize(12)
  doc.text('Patient:', 20, 45)
  doc.setFontSize(11)
  
  // Vérifier si on a un nom de patient ou juste un ID
  if (data.patientName) {
    doc.text(`${data.patientName}`, 65, 45)
  } else if (data.ID_dossier_medical) {
    doc.text(`ID: ${data.ID_dossier_medical}`, 65, 45)
  } else {
    doc.text('Patient non spécifié', 65, 45)
  }
  
  // Ajouter une date de naissance si disponible
  if (data.dateNaissance) {
    doc.text(`Né(e) le: ${format(new Date(data.dateNaissance), 'dd/MM/yyyy', { locale: fr })}`, 65, 52)
  }
  
  // Type de certificat
  doc.setFontSize(12)
  doc.text('Type de certificat:', 20, 60)
  doc.setFontSize(11)
  
  // Mapper les types pour une meilleure lisibilité
  const typeMap = {
    'medical': 'Certificat médical',
    'aptitude': 'Certificat d\'aptitude',
    'inaptitude': 'Certificat d\'inaptitude',
    'presence': 'Certificat de présence'
  }
  
  doc.text(typeMap[data.type] || data.type, 65, 60)
  
  // Motif
  doc.setFontSize(12)
  doc.text('Motif:', 20, 75)
  doc.setFontSize(11)
  const splitMotif = doc.splitTextToSize(data.motif || 'Non spécifié', 160)
  doc.text(splitMotif, 25, 82)
  
  // Décalage vertical basé sur la hauteur du motif
  let yPos = 82 + (splitMotif.length * 7)
  
  // Ajouter la période si disponible
  if (data.dateDebut && data.dateFin) {
    doc.setFontSize(12)
    doc.text('Période de validité:', 20, yPos + 10)
    doc.setFontSize(11)
    doc.text(`Du ${format(new Date(data.dateDebut), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(data.dateFin), 'dd/MM/yyyy', { locale: fr })}`, 25, yPos + 17)
    yPos += 25
  }
  
  // Contenu principal
  doc.setFontSize(12)
  doc.text('Contenu:', 20, yPos + 5)
  doc.setFontSize(11)
  const splitContenu = doc.splitTextToSize(data.contenu || 'Aucun contenu', 160)
  doc.text(splitContenu, 25, yPos + 15)
  
  // Calcul de la position verticale pour la signature
  yPos = Math.max(yPos + 15 + (splitContenu.length * 7), 200)
  
  // Signature
  doc.setFontSize(11)
  doc.text('Signature et cachet du médecin:', 120, yPos)
  doc.line(120, yPos + 25, 180, yPos + 25)
  
  // Pied de page
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text(`Document généré le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 105, 280, { align: 'center' })
  doc.text('Ce document a été généré localement et peut ne pas contenir toutes les informations officielles.', 105, 285, { align: 'center' })
  
  // Réinitialiser la couleur du texte
  doc.setTextColor(0, 0, 0)

  if (preview) {
    const blob = doc.output('blob');
    return URL.createObjectURL(blob);
  } else {
    return doc.output('blob');
  }
}

// Fonction pour générer le PDF d'une évolution médicale
export const generateEvolutionPDF = async (data, preview = false) => {
  const doc = new jsPDF()
  
  // En-tête
  doc.setFontSize(20)
  doc.text('Évolution Médicale', 105, 20, { align: 'center' })
  
  // Date de génération
  doc.setFontSize(10)
  doc.text(`Document généré le ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, 190, 30, { align: 'right' })
  
  // Ligne de séparation
  doc.setLineWidth(0.1)
  doc.line(20, 35, 190, 35)
  
  // Informations principales
  doc.setFontSize(14)
  doc.text('Mesure: ' + (data.nomMesure || 'Non spécifiée'), 20, 45)
  
  // Date de la mesure
  doc.setFontSize(12)
  doc.text('Date:', 20, 55)
  let dateMesure = 'Non spécifiée'
  try {
    if (data.date) {
      dateMesure = format(new Date(data.date), 'dd/MM/yyyy à HH:mm', { locale: fr })
    } else if (data.created_at) {
      dateMesure = format(new Date(data.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })
    }
  } catch (e) {
    console.error('Erreur lors du formatage de la date:', e)
  }
  doc.text(dateMesure, 60, 55)
  
  // Valeur de la mesure
  doc.setFontSize(12)
  doc.text('Valeur:', 20, 65)
  
  // Formatter la valeur selon le type de mesure
  let valeurFormatee = data.valeurDeMesure !== undefined ? String(data.valeurDeMesure) : 'Non spécifiée'
  let unite = ''
  
  // Ajouter des unités selon le type de mesure
  switch (data.nomMesure ? data.nomMesure.toLowerCase() : '') {
    case 'temperature':
    case 'température':
      unite = '°C'
      break
    case 'poids':
    case 'masse':
      unite = 'kg'
      break
    case 'taille':
    case 'hauteur':
      unite = 'cm'
      break
    case 'tension':
    case 'pression artérielle':
      unite = 'mmHg'
      break
    case 'pouls':
    case 'fréquence cardiaque':
      unite = 'bpm'
      break
    case 'glycémie':
      unite = 'mmol/l'
      break
    case 'saturation':
    case 'spo2':
      unite = '%'
      break
    default:
      unite = ''
  }
  
  doc.text(`${valeurFormatee} ${unite}`, 60, 65)
  
  // Informations complémentaires ou observations
  if (data.observations || data.notes || data.commentaire) {
    doc.setFontSize(12)
    doc.text('Observations:', 20, 80)
    
    const observations = data.observations || data.notes || data.commentaire || ''
    const splitObservations = doc.splitTextToSize(observations, 170)
    
    doc.setFontSize(10)
    doc.text(splitObservations, 20, 86)
  }
  
  // Graphique si il y a des données historiques (ici juste un placeholder)
  if (data.historique && data.historique.length > 0) {
    const yPosition = (data.observations || data.notes || data.commentaire) 
      ? 86 + (doc.splitTextToSize(data.observations || data.notes || data.commentaire || '', 170).length * 5) + 15
      : 80
    
    doc.setFontSize(12)
    doc.text('Historique des mesures:', 20, yPosition)
    
    // Créer un tableau avec l'historique
    const tableColumns = ['Date', 'Valeur']
    const tableData = data.historique.map(item => [
      format(new Date(item.date), 'dd/MM/yyyy', { locale: fr }),
      `${item.valeur} ${unite}`
    ])
    
    doc.autoTable({
      startY: yPosition + 5,
      head: [tableColumns],
      body: tableData,
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 10 }
    })
  }
  
  // Pied de page
  const pageHeight = doc.internal.pageSize.height
  doc.setFontSize(10)
  doc.text(`Ce document est confidentiel et réservé à l'usage médical.`, 105, pageHeight - 20, { align: 'center' })
  
  if (preview) {
    // Retourner le blob pour la prévisualisation
    return doc.output('blob')
  } else {
    // Retourner le blob pour l'impression ou le téléchargement
    return doc.output('blob')
  }
}