import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'reports.db');

let db: Database.Database | null = null;

export interface ReportRecord {
  id?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  language: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileData?: string; // Base64 encoded file for processing
  rawExtraction?: string;
  simplifiedReport?: string;
  recommendations?: string | null;
  insights?: string | null;
  resources?: string | null;
  errorMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function getDatabasePath(): string {
  return DB_PATH;
}

function ensureColumn(columnName: string, definition: string): void {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const columns = db.prepare(`PRAGMA table_info(reports)`).all() as { name: string }[];
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE reports ADD COLUMN ${definition}`);
  }
}

// Initialize the database and create tables if they don't exist
export function initializeDatabase(): void {
  if (db) return;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create reports table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      fileName TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      mimeType TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'English',
      status TEXT NOT NULL DEFAULT 'pending',
      fileData TEXT,
      rawExtraction TEXT,
      simplifiedReport TEXT,
      recommendations TEXT,
      insights TEXT,
      resources TEXT,
      errorMessage TEXT,
      createdAt TEXT DEFAULT (datetime('now')),
      updatedAt TEXT DEFAULT (datetime('now'))
    )
  `);

  // Keep older local databases compatible without hiding partial migration failures.
  ensureColumn('status', `status TEXT NOT NULL DEFAULT 'pending'`);
  ensureColumn('fileData', `fileData TEXT`);
  ensureColumn('rawExtraction', `rawExtraction TEXT`);
  ensureColumn('simplifiedReport', `simplifiedReport TEXT`);
  ensureColumn('recommendations', `recommendations TEXT`);
  ensureColumn('insights', `insights TEXT`);
  ensureColumn('resources', `resources TEXT`);
  ensureColumn('errorMessage', `errorMessage TEXT`);
  ensureColumn('updatedAt', `updatedAt TEXT DEFAULT (datetime('now'))`);

  // Create indexes for faster queries
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(createdAt);
    CREATE INDEX IF NOT EXISTS idx_reports_file_name ON reports(fileName);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
  `);

  console.log('✅ Database initialized successfully');
}

// Save a new report (initial upload before processing)
export function saveReport(report: {
  fileName: string;
  fileSize: number;
  mimeType: string;
  language: string;
  fileData?: string;
  status?: string;
}): string {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const stmt = db.prepare(`
    INSERT INTO reports (fileName, fileSize, mimeType, language, fileData, status)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING id
  `);

  const row = stmt.get(
    report.fileName,
    report.fileSize,
    report.mimeType,
    report.language,
    report.fileData || null,
    report.status || 'pending'
  ) as { id: string } | undefined;

  if (!row?.id) {
    throw new Error('Failed to create report record');
  }

  return row.id;
}

// Update report with analysis results
export function updateReportAnalysis(id: string, updates: {
  status?: string;
  rawExtraction?: string;
  simplifiedReport?: string;
  recommendations?: string | null;
  insights?: string | null;
  resources?: string | null;
  errorMessage?: string;
}): boolean {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const fields: string[] = [];
  const values: any[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }

  if (updates.rawExtraction !== undefined) {
    fields.push('rawExtraction = ?');
    values.push(updates.rawExtraction);
  }

  if (updates.simplifiedReport !== undefined) {
    fields.push('simplifiedReport = ?');
    values.push(updates.simplifiedReport);
  }

  if (updates.recommendations !== undefined) {
    fields.push('recommendations = ?');
    values.push(updates.recommendations);
  }

  if (updates.insights !== undefined) {
    fields.push('insights = ?');
    values.push(updates.insights);
  }

  if (updates.resources !== undefined) {
    fields.push('resources = ?');
    values.push(updates.resources);
  }

  if (updates.errorMessage !== undefined) {
    fields.push('errorMessage = ?');
    values.push(updates.errorMessage);
  }

  if (fields.length === 0) {
    return false;
  }

  fields.push("updatedAt = datetime('now')");
  values.push(id);

  const stmt = db.prepare(`
    UPDATE reports SET ${fields.join(', ')} WHERE id = ?
  `);

  const result = stmt.run(...values);
  return result.changes > 0;
}

// Get all reports
export function getAllReports(): ReportRecord[] {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const stmt = db.prepare(`
    SELECT * FROM reports ORDER BY createdAt DESC
  `);

  return stmt.all() as ReportRecord[];
}

// Get a report by ID
export function getReportById(id: string): ReportRecord | null {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const stmt = db.prepare(`
    SELECT * FROM reports WHERE id = ?
  `);

  return (stmt.get(id) as ReportRecord) || null;
}

// Delete a report by ID
export function deleteReport(id: string): boolean {
  if (!db) {
    throw new Error('Database not initialized');
  }

  const stmt = db.prepare(`
    DELETE FROM reports WHERE id = ?
  `);

  const result = stmt.run(id);
  return result.changes > 0;
}

// Close the database connection
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}
