export const printInvoice = (printAreaRef) => {
  const printContent = printAreaRef.value.innerHTML
  const originalContent = document.body.innerHTML

  // Créer une nouvelle fenêtre pour l'impression
  const printWindow = window.open('', '_blank')
  printWindow.document.open()
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Impression Facture</title>
        <link rel="stylesheet" href="/src/assets/main.css">
        <style>
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 20mm;
            }
          }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
    </html>
  `)
  printWindow.document.close()

  // Attendre le chargement des styles
  printWindow.onload = () => {
    printWindow.print()
    printWindow.onafterprint = () => {
      printWindow.close()
    }
  }
} 