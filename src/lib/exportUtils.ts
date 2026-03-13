import * as XLSX from 'xlsx-js-style'

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

  const worksheet = XLSX.utils.json_to_sheet(data)
  
  // Apply header styling to simple export
  const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
  const colWidths = Object.keys(data[0] || {}).map(k => ({ wch: Math.max(k.length + 5, 12) }));
  worksheet['!cols'] = colWidths;

  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell_address = { c: C, r: 0 };
    const cell_ref = XLSX.utils.encode_cell(cell_address);
    if (worksheet[cell_ref]) {
      worksheet[cell_ref].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } }, // Indigo 600
        alignment: { horizontal: "center", vertical: "center" }
      };
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
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
      
      const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1");
      const colWidths = Object.keys(sheet.data[0] || {}).map(k => ({ wch: Math.max(k.length + 5, 12) }));
      worksheet['!cols'] = colWidths;

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_ref = XLSX.utils.encode_cell({ c: C, r: R });
          const cell = worksheet[cell_ref];
          if (!cell) continue;

          let isHeader = R === 0;
          let isHighlight = false;
          let isStatus = false;

          // Check if this column needs highlighting in the Financial Summary sheet
          if (sheet.sheetName === 'Financial Summary') {
            const headerCell = worksheet[XLSX.utils.encode_cell({c: C, r: 0})];
            if (headerCell && (headerCell.v === 'Net Profit' || headerCell.v === 'Total Revenue')) {
              isHighlight = true;
            }
            if (headerCell && headerCell.v === 'Status' && (cell.v === 'Profit' || cell.v === 'Loss')) {
              isStatus = true;
            }
          }

          // Also highlight Remaining Balances in Vendor Balances
          if (sheet.sheetName === 'Vendor Balances') {
             const headerCell = worksheet[XLSX.utils.encode_cell({c: C, r: 0})];
             if (headerCell && headerCell.v === 'Remaining Balance') isHighlight = true;
          }

          if (isHeader) {
            cell.s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "4F46E5" } }, // Indigo 600
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else if (isHighlight) {
            cell.s = {
              font: { bold: true, color: { rgb: "000000" } },
              fill: { fgColor: { rgb: "FDE047" } } // Yellow 300
            };
          } else if (isStatus) {
            cell.s = {
              font: { bold: true, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: cell.v === 'Profit' ? "22C55E" : "EF4444" } }, // Green / Red
              alignment: { horizontal: "center" }
            };
          }
        }
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.sheetName)
    }
  })

  if (workbook.SheetNames.length === 0) {
    alert('No data found in any tables to export')
    return
  }

  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}
