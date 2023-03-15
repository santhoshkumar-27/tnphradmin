import * as XLSX from 'xlsx';

export function exportToExcel(records: any, fileName: string) {
  const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(records);
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  let colWidths: any = [];
  const columns = Object.keys(records[0]);
  for (var j = 0; j < columns.length; j++) {
    // let maxWidth = records[0][columns[j]]?.length || 0;
    // for (var i = 0; i < records.length; i++) {
    //   let width = records[i][columns[j]]?.length || 0;
    //   if (width > maxWidth) maxWidth = width;
    // }
    colWidths.push({
      width: 20,
    });
  }
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, fileName);
}
