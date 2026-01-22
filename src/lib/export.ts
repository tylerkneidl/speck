/**
 * CSV Export Utilities
 *
 * Generates RFC 4180 compliant CSV files from data arrays.
 */

/**
 * Escapes a value for CSV format.
 * - Wraps in quotes if contains comma, quote, or newline
 * - Escapes internal quotes by doubling them
 */
function escapeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // If contains special characters, wrap in quotes and escape internal quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Generates a CSV string from an array of data objects.
 *
 * @param data - Array of objects to convert to CSV
 * @param columns - Array of column keys to include (determines order)
 * @returns CSV-formatted string with header row and data rows
 *
 * @example
 * ```ts
 * const csv = generateCSV(
 *   [{ time: 0, x: 1.5, y: 2.3 }],
 *   ['time', 'x', 'y']
 * )
 * // Returns: "time,x,y\n0,1.5,2.3"
 * ```
 */
export function generateCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: (keyof T)[]
): string {
  // Header row
  const header = columns.join(',')

  // Data rows
  const rows = data.map((row) => columns.map((col) => escapeValue(row[col])).join(','))

  return [header, ...rows].join('\n')
}

/**
 * Triggers a browser download of a CSV file.
 *
 * @param csv - CSV content string
 * @param filename - Name for the downloaded file (should end in .csv)
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Convenience function to export table data to CSV.
 * Includes all kinematic columns with appropriate headers.
 */
export function exportTableData(
  data: Array<{
    rowNumber: number
    time: number
    worldX: number | null
    worldY: number | null
    vx: number | null
    vy: number | null
    speed: number | null
    ax: number | null
    ay: number | null
  }>,
  projectName: string,
  unit: string
): void {
  // Create header-friendly column names
  const exportData = data.map((row) => ({
    '#': row.rowNumber,
    't (s)': row.time,
    [`x (${unit})`]: row.worldX,
    [`y (${unit})`]: row.worldY,
    [`vx (${unit}/s)`]: row.vx,
    [`vy (${unit}/s)`]: row.vy,
    [`|v| (${unit}/s)`]: row.speed,
    [`ax (${unit}/s²)`]: row.ax,
    [`ay (${unit}/s²)`]: row.ay,
  }))

  const columns = [
    '#',
    't (s)',
    `x (${unit})`,
    `y (${unit})`,
    `vx (${unit}/s)`,
    `vy (${unit}/s)`,
    `|v| (${unit}/s)`,
    `ax (${unit}/s²)`,
    `ay (${unit}/s²)`,
  ]

  const csv = generateCSV(exportData, columns)
  const filename = `${projectName.replace(/[^a-zA-Z0-9]/g, '-')}-motion-data.csv`

  downloadCSV(csv, filename)
}
