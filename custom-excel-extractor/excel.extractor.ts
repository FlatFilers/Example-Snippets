import * as XLSX from 'xlsx'
import {mapKeys, mapValues} from 'remeda'
import {AbstractExtractor, SheetCapture} from './abstract.extractor'

export class ExcelExtractor extends AbstractExtractor {
  /**
   * Parse a file buffer into a captured sheet
   *
   * @param buffer
   */
  public parseBuffer(buffer: Buffer): Record<string, SheetCapture> {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
    })

    return mapValues(workbook.Sheets, (value, key) => {
      return this.convertSheet(value)
    })
  }

  /**
   * Convert a template sheet using a special template format
   *
   * @param sheet
   */
  convertSheet(sheet: XLSX.WorkSheet): SheetCapture {
    let rows = XLSX.utils.sheet_to_json(sheet, {header: 'A', defval: null})

    // use a basic pattern check on the 1st row - should be switched to core header detection
    const hasHeader = rows[0]
      ? Object.values(rows[0]).some((v) => v?.includes('*'))
      : false

    // use a basic pattern check on the 2nd row - can be modified
    const hasSubHeader = rows[0]
      ? Object.values(rows[1]).some((v) => v?.includes(':'))
      : false

    const colMap: Record<string, string> | null = hasHeader
      ? (rows.shift() as any)
      : null

    const subHeader = hasSubHeader ? rows.shift() : null

    if (colMap) {
      const headers = mapValues(colMap, (val) => val?.replace('*', ''))
      const required = mapValues(colMap, (val) => val?.includes('*'))
      const data = rows.map((row) => mapKeys(row, (key) => headers[key]))
      return {
        headers: Object.values(headers).filter((v) => v),
        required: mapKeys(required, (k) => headers[k]),
        descriptions: subHeader ? mapKeys(subHeader, (k) => headers[k]) : null,
        data,
      }
    } else {
      return {headers: Object.keys(rows[0]), data: rows}
    }
  }

  /**
   * Extract the data from an uploaded XLSX file
   */
  public async runExtraction(): Promise<boolean> {
    try {
      const {data: file} = await this.api.getFile({fileId: this.fileId})
      if (file.ext !== 'xlsx') {
        return false
      }
      const job = await this.startJob()
      const buffer = await this.getFileBufferFromApi()

      const capture = this.parseBuffer(buffer)
      const workbook = await this.createWorkbook(file, capture)
      for (const sheet of workbook.sheets) {
        if (!capture[sheet.name]) {
          continue
        }
        const recordsData = this.makeAPIRecords(capture[sheet.name])
        await this.api.addRecords({
          workbookId: workbook.id,
          sheetId: sheet.id,
          recordsData,
        })
      }
      await this.completeJob(job)
      return true
    } catch (e) {
      return false
    }
  }
}
