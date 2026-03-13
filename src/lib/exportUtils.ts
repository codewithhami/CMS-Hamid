import * as XLSX from 'xlsx'

/**
 * Exports an array of objects to an Excel file.
 * @param data Array of objects to export
 * @param fileName Desired file name (without extension)
 * @param sheetName Name of the Excel sheet
 */
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('No data available to export')
    return
  }

  // Create a worksheet from the JSON data
  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Create a new workbook
  const workbook = XLSX.utils.book_new()
  
  // Append the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}
/**
 * Exports multiple datasets to a single Excel file with multiple sheets.
 * @param sheets Array of objects containing sheetName and data
 * @param fileName Desired file name (without extension)
 */
export function exportAllToExcel(sheets: { data: any[], sheetName: string }[], fileName: string) {
  if (!sheets || sheets.length === 0) {
    alert('No data available to export')
    return
  }

  const workbook = XLSX.utils.book_new()

  sheets.forEach(sheet => {
    if (sheet.data && sheet.data.length > 0) {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName)
    }
  })

  if (workbook.SheetNames.length === 0) {
    alert('No data found in any tables to export')
    return
  }

  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}
