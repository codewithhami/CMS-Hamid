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
          let isSeparator = cell.v === '---' || (cell.v === '' && worksheet[XLSX.utils.encode_cell({c: 0, r: R})]?.v === '---');

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
          } else if (isSeparator) {
            cell.s = {
              fill: { fgColor: { rgb: "E2E8F0" } } // Slate 200 (Separator Line)
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

/**
 * Exports a customized Vendor Invoice matching a specific physical layout.
 * Includes merged cells, calculated fields, and specific color coding.
 */
export function exportVendorInvoice(vendor: any, dateStr: string = new Date().toISOString().split('T')[0]) {
  if (!vendor || !vendor.vendor_orders || vendor.vendor_orders.length === 0) {
    alert('No orders available for this vendor to export.')
    return
  }

  const aoa: any[][] = []
  
  // Row 1: Blank padding
  aoa.push([])

  // Row 2: Title (Col A to I)
  aoa.push([`${vendor.name} Whole Sale Dealer Invoice`, '', '', '', '', '', '', '', ''])
  
  // Row 3: Date (Col A to I)
  aoa.push([`Dated ${dateStr}`, '', '', '', '', '', '', '', ''])

  // Row 4: Headers
  aoa.push(['Ser', 'Name', 'Stitches', 'Net Stich', 'Rate', 'Head', 'Repeat', 'Amount', 'Total'])
  
  let currentRow = 4 // 0-indexed. This is row 5 in Excel
  const merges: any[] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Title
    { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // Date
  ]

  let totalBillAmount = 0
  let isGreyBg = false // To alternate background row colors if needed, or by order

  vendor.vendor_orders.forEach((order: any, orderIndex: number) => {
    const parts = order.vendor_order_parts || []
    if (parts.length === 0) return
    
    let orderStartRow = currentRow
    let orderTotal = 0

    // Insert a small separator line between orders (except before the first)
    if (orderIndex > 0) {
      aoa.push(['---', '---', '---', '---', '---', '---', '---', '---', '---'])
      currentRow++
      orderStartRow++ // Increment because we added a line before the data starts
    }

    parts.forEach((part: any, idx: number) => {
      let netStichNum = 0
      let amount = Number(part.total_bill) || 0
      
      if (!part.is_suit) {
        netStichNum = (Number(part.stitches) || 0) / 1000
        if (amount === 0) {
          amount = Math.round(netStichNum * (Number(part.rate)||0) * (Number(part.head)||0) * (Number(part.repeat_count)||0))
        }
      } else if (amount === 0) {
        amount = Math.round((Number(part.suit_quantity) || 0) * (Number(part.rate) || 0))
      }
      
      orderTotal += amount
      
      aoa.push([
        part.is_suit ? `Suit (${part.suit_quantity})` : (part.part_name || 'Part'),
        idx === 0 ? order.design_name || 'N/A' : '',
        part.is_suit ? part.suit_quantity : (part.stitches || 0),
        part.is_suit ? 'N/A' : netStichNum.toFixed(1),
        part.rate || 0,
        part.is_suit ? 1 : (part.head || 0),
        part.is_suit ? 1 : (part.repeat_count || 0),
        amount,
        idx === 0 ? 'TOTAL_PLACEHOLDER' : '' // Will be replaced after calculating sum
      ])
      currentRow++
    })

    // Revisit the first row of this order to insert the exact Total
    aoa[orderStartRow][8] = orderTotal
    totalBillAmount += orderTotal

    // Merge the 'Name' (Col B) and 'Total' (Col I) vertically if the order has multiple parts
    if (parts.length > 1) {
      merges.push({ s: { r: orderStartRow, c: 1 }, e: { r: currentRow - 1, c: 1 } }) // Col 1 = Name
      merges.push({ s: { r: orderStartRow, c: 8 }, e: { r: currentRow - 1, c: 8 } }) // Col 8 = Total
    }
  })

  // Footer Row: Total Amount
  aoa.push(['Total Amount of Bill', '', '', '', '', '', '', '', totalBillAmount])
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 7 } })

  const worksheet = XLSX.utils.aoa_to_sheet(aoa)
  worksheet['!merges'] = merges
  
  // Set accurate column widths matching the visual layout
  worksheet['!cols'] = [
    { wch: 10 }, // Ser
    { wch: 14 }, // Name
    { wch: 12 }, // Stitches
    { wch: 12 }, // Net Stich
    { wch: 8 },  // Rate
    { wch: 8 },  // Head
    { wch: 8 },  // Repeat
    { wch: 10 }, // Amount
    { wch: 14 }  // Total
  ]

  // Apply visual styling exactly like the provided image
  const range = XLSX.utils.decode_range(worksheet['!ref'] || "A1")
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_ref = XLSX.utils.encode_cell({ c: C, r: R })
      
      // Initialize empty cells within the bounding box so formatting applies universally
      if (!worksheet[cell_ref]) worksheet[cell_ref] = { t: 's', v: '' }
      const cell = worksheet[cell_ref]

      // Standard Borders & Centering
      let cellStyle: any = {
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { auto: 1 } },
          bottom: { style: "thin", color: { auto: 1 } },
          left: { style: "thin", color: { auto: 1 } },
          right: { style: "thin", color: { auto: 1 } }
        }
      }

      if (R === 1 || R === 2) {
        // Title & Date Header (Gold/Mustard Background)
        cellStyle.fill = { fgColor: { rgb: "C9B037" } }
        cellStyle.font = { bold: true, sz: 14, color: { rgb: "000000" } }
        
      } else if (R === 3) {
        // Column Headers (Light Greyish/Blue Background)
        cellStyle.fill = { fgColor: { rgb: "B4C6E7" } }
        cellStyle.font = { bold: true, color: { rgb: "000000" } }
        
      } else if (R === currentRow) {
        // Bottom Footer 'Total Amount of Bill' (Gold/Mustard Background)
        cellStyle.fill = { fgColor: { rgb: "C9B037" } }
        cellStyle.font = { bold: true, sz: 12, color: { rgb: "000000" } }
        if (C === 8) {
           // The actual total number
           cellStyle.fill = { fgColor: { rgb: "C9B037" } }
           cellStyle.font = { bold: true, sz: 12, color: { rgb: "000000" } }
        }

      } else if (cell.v === '---') {
        // Separator Row Styling
        cellStyle.fill = { fgColor: { rgb: "E2E8F0" } }
        cellStyle.font = { color: { rgb: "E2E8F0" } } // Hide the '---' text
        cell.v = '' // Clear text but keep style

      } else if (R > 3 && R < currentRow) {
        // Data Rows
        let bgHex = "FFFFFF"
        let fontColor = "000000"
        let isBold = false

        if (C === 8) {
          // 'Total' Column (Strong Blue)
          bgHex = "4F81BD"
          isBold = true
        } else if (C === 1) {
          // 'Name' Column (Light Grey)
          bgHex = "E7E6E6"
          isBold = true
        } else if (C === 3 || C === 5 || C === 7) {
          // Alternating slightly tinted columns (Net Stich, Head, Amount)
          bgHex = "DDEBF7"
        } else {
          // Other data columns (Ser, Stitches, Rate, Repeat)
          bgHex = "F2F2F2"
        }

        cellStyle.fill = { fgColor: { rgb: bgHex } }
        cellStyle.font = { bold: isBold, color: { rgb: fontColor } }
      }

      // Apply style only if cell isn't row 0 blank padding
      if (R > 0) {
        cell.s = cellStyle
      }
    }
  }

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice')
  XLSX.writeFile(workbook, `${vendor.name}_Invoice_${dateStr}.xlsx`)
}
