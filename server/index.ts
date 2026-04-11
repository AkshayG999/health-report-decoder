import express from 'express';
import cors from 'cors';
import { initializeDatabase, saveReport, updateReportAnalysis, getAllReports, getReportById, deleteReport, getDatabasePath } from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 3001);
const VALID_STATUSES = new Set(['pending', 'processing', 'completed', 'failed']);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize database
initializeDatabase();

// API Routes

// Save initial report (before AI processing)
app.post('/api/reports', (req, res) => {
  try {
    const { fileName, fileSize, mimeType, language, fileData } = req.body;
    
    if (typeof fileName !== 'string' || fileName.trim() === '') {
      return res.status(400).json({ success: false, error: 'fileName is required' });
    }

    if (typeof fileSize !== 'number' || fileSize < 0) {
      return res.status(400).json({ success: false, error: 'fileSize must be a non-negative number' });
    }

    if (typeof mimeType !== 'string' || mimeType.trim() === '') {
      return res.status(400).json({ success: false, error: 'mimeType is required' });
    }

    const reportId = saveReport({
      fileName: fileName.trim(),
      fileSize,
      mimeType: mimeType.trim(),
      language: language || 'English',
      fileData,
      status: 'pending'
    });

    res.status(201).json({ 
      success: true, 
      reportId,
      message: 'Report saved successfully',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ success: false, error: 'Failed to save report' });
  }
});

// Update report with AI analysis results
app.put('/api/reports/:id/analysis', (req, res) => {
  try {
    const { status, rawExtraction, simplifiedReport, recommendations, insights, resources, errorMessage } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid report status' });
    }

    const success = updateReportAnalysis(req.params.id, {
      status,
      rawExtraction,
      simplifiedReport,
      recommendations: recommendations ? JSON.stringify(recommendations) : null,
      insights,
      resources: resources ? JSON.stringify(resources) : null,
      errorMessage
    });

    if (!success) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({ 
      success: true, 
      message: 'Report analysis updated successfully',
      status
    });
  } catch (error) {
    console.error('Error updating report analysis:', error);
    res.status(500).json({ success: false, error: 'Failed to update report analysis' });
  }
});

// Get all reports
app.get('/api/reports', (req, res) => {
  try {
    const reports = getAllReports();
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch reports' });
  }
});

// Get a specific report by ID
app.get('/api/reports/:id', (req, res) => {
  try {
    const report = getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch report' });
  }
});

// Delete a report by ID
app.delete('/api/reports/:id', (req, res) => {
  try {
    const success = deleteReport(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ success: false, error: 'Failed to delete report' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Database initialized at: ${getDatabasePath()}`);
});

export default app;
