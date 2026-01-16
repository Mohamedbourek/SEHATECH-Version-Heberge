<template>
  <div ref="cardRef" class="patient-card">
    <div class="card-container">
      <!-- Header with gradient background and photo -->
      <div class="card-header">
        <div class="photo-container">
          <img :src="photoComputed" alt="Photo du patient" class="patient-photo" />
        </div>
        <div class="header-text">
          <h1 class="company-name">HOSPITAL CARD</h1>
          <p class="subtitle">Centre Hospitalier</p>
        </div>
      </div>

      <div class="card-content">
        <!-- Patient information with left-aligned layout -->
        <div class="patient-info-container">
          <h3 class="patient-name">
            {{ formattedData.nom }} {{ formattedData.prenom }}
          </h3>
          
          <div class="info-rows">
            <div class="info-row">
              <div class="info-label">ID No</div>
              <div class="info-value">{{ formattedData.id }}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Date de naissance</div>
              <div class="info-value">{{ formattedData.dateNaissance }}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Groupe sanguin</div>
              <div class="info-value blood-group">{{ formattedData.groupeSanguin }}</div>
            </div>
          </div>
        </div>
        
        <!-- QR Code on the right -->
        <div class="qr-code-container">
          <QRCode
            :value="qrValue"
            :options="{
              width: 64,
              margin: 0,
              color: { dark: '#0284c7', light: '#ffffff' },
              scale: 1,
              errorCorrectionLevel: 'M'
            }"
            class="qr-code-img"
          />
        </div>
      </div>
      
      <!-- Card footer with pattern -->
      <div class="card-footer"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import QRCode from 'qrcode.vue'

const props = defineProps({
  patientData: {
    type: Object,
    required: true
  },
  photo: {
    type: String,
    default: null
  }
})

// Default photo (SVG encoded in base64)
const defaultPhoto =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iNDAiIGZpbGw9IiM5Q0EzQUYiLz4KICA8cGF0aCBkPSJNMTYwIDE4MEgzNkM0MCAxNDAgNjYgMTIwIDEwMCAxMjBDMTM0IDEyMCAxNjAgMTQwIDE2NCAxODBIMTYwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4='

// Format date to French format
const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('fr-FR')
}

// Format data for display
const formattedData = computed(() => {
  const pd = props.patientData || {};
  return {
    id: pd.id || 'N/A',
    nom: pd.nom || pd.utilisateur?.nom || '',
    prenom: pd.prenom || pd.utilisateur?.prenom || '',
    dateNaissance: formatDate(pd.dateNaissance || pd.utilisateur?.dateNaissance),
    numeroSecu: pd.numeroSecu || 'N/A',
    groupeSanguin: pd.groupeSanguin || pd.utilisateur?.groupeSanguin || pd.patient?.groupeSanguin || 'N/A'
  }
});

const photoComputed = computed(() => {
  return props.photo || props.patientData?.base64_photo || props.patientData?.utilisateur?.base64_photo || defaultPhoto;
});

// QR code management
const qrValue = computed(() => {
  if (props.patientData?.codeQR) {
    try {
      const parsed = JSON.parse(props.patientData.codeQR);
      return JSON.stringify(parsed);
    } catch (e) {
      return props.patientData.codeQR;
    }
  }
  return `PATIENT-${props.patientData?.id || 'N/A'}`;
});

// Reference for printing
const cardRef = ref(null)
</script>

<style scoped>
.patient-card {
  font-family: 'Roboto', 'Arial', sans-serif;
}

.card-container {
  width: 85.6mm;
  height: 53.98mm;
  background: white;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.card-header {
  height: 28%;
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  padding: 0.75rem 1rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.photo-container {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid white;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.patient-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.header-text {
  text-align: right;
}

.company-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 1px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.subtitle {
  font-size: 0.7rem;
  margin: 0;
  opacity: 0.9;
  font-weight: 300;
}

.card-content {
  display: flex;
  flex: 1;
  padding: 0.5rem 1rem;
}

.patient-info-container {
  flex: 1;
}

.patient-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-rows {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.info-row {
  display: flex;
  align-items: baseline;
}

.info-label {
  width: 35%;
  font-size: 0.55rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.info-value {
  width: 65%;
  font-size: 0.7rem;
  color: #1f2937;
  font-weight: 500;
}

.blood-group {
  color: #dc2626;
  font-weight: 700;
}

.qr-code-container {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-left: 0.5rem;
}

.qr-code-img {
  display: block;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 3px;
  background: white;
}

.card-footer {
  height: 8px;
  width: 100%;
  background: repeating-linear-gradient(
    45deg,
    #0284c7,
    #0284c7 10px,
    #0369a1 10px,
    #0369a1 20px
  );
  margin-top: auto;
}
</style>