/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useSettings, useUI } from '../lib/state';
import { useState, useMemo } from 'react';
import c from 'classnames';
import { AVAILABLE_VOICES, AVAILABLE_LANGUAGES } from '../lib/constants';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { useHistoryStore, HistoryItem } from '../lib/history';
import { jsPDF } from 'jspdf';

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const {
    systemPrompt, voice, language1, language2, topic, autoDetectLanguage,
    setSystemPrompt, setVoice, setLanguage1, setLanguage2, setTopic, setAutoDetectLanguage
  } = useSettings();
  const { connected } = useLiveAPIContext();
  const { history, clearHistory } = useHistoryStore();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const itemDate = new Date(item.timestamp);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start) {
        start.setHours(0, 0, 0, 0);
        if (itemDate < start) return false;
      }
      if (end) {
        // End date should include the entire day
        const endDay = new Date(end);
        endDay.setHours(23, 59, 59, 999);
        if (itemDate > endDay) return false;
      }
      return true;
    });
  }, [history, startDate, endDate]);

  const handleSave = () => {
    toggleSidebar();
  };

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      exportToPDF();
    } else {
      exportToCSV();
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Translation History', 10, 15);
    doc.setFontSize(10);
    
    let yOffset = 25;
    const margin = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;

    filteredHistory.forEach((item, index) => {
      if (yOffset > 270) {
        doc.addPage();
        yOffset = 15;
      }

      const dateStr = new Date(item.timestamp).toLocaleString();
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. [${dateStr}] ${item.lang1} -> ${item.lang2}`, margin, yOffset);
      yOffset += 6;

      doc.setFont('helvetica', 'normal');
      const sourceLines = doc.splitTextToSize(`Source: ${item.sourceText}`, maxWidth);
      doc.text(sourceLines, margin, yOffset);
      yOffset += (sourceLines.length * 5) + 2;

      const transLines = doc.splitTextToSize(`Translation: ${item.translatedText}`, maxWidth);
      doc.text(transLines, margin, yOffset);
      yOffset += (transLines.length * 5) + 8;
    });

    doc.save(`translation_history_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'From', 'To', 'Source Text', 'Translated Text'];
    const rows = filteredHistory.map(item => [
      new Date(item.timestamp).toISOString(),
      item.lang1,
      item.lang2,
      `"${item.sourceText.replace(/"/g, '""')}"`,
      `"${item.translatedText.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `translation_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <aside className={c('sidebar', { open: isSidebarOpen })}>
      <div className="sidebar-header">
        <h3>Settings</h3>
        <button onClick={toggleSidebar} className="close-button">
          <span className="icon">close</span>
        </button>
      </div>
      <div className="sidebar-content">
        <div className="sidebar-section">
          <fieldset disabled={connected}>
            <label>
              Voice
              <select value={voice} onChange={e => setVoice(e.target.value)}>
                {AVAILABLE_VOICES.map(v => (
                  <option key={v.value} value={v.value}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          <button
            onClick={handleSave}
            className="save-settings-button"
            disabled={connected}
          >
            Close Settings
          </button>
        </div>
        <div className="sidebar-section history-section">
          <div className="sidebar-section-title-wrapper">
            <h4 className="sidebar-section-title">Translation History</h4>
            <button
              onClick={clearHistory}
              className="clear-history-button"
              disabled={history.length === 0}
              aria-label="Clear translation history"
            >
              <span className="icon">delete_sweep</span> Clear
            </button>
          </div>

          <div className="history-filters">
            <div className="filter-group">
              <label>From:
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </label>
              <label>To:
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </label>
            </div>
            
            <div className="export-controls">
              <select 
                value={exportFormat} 
                onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv')}
                className="export-format-select"
              >
                <option value="pdf">PDF Format</option>
                <option value="csv">CSV Format</option>
              </select>
              <button
                onClick={handleExport}
                className="export-button"
                disabled={filteredHistory.length === 0}
                aria-label={`Export history to ${exportFormat.toUpperCase()}`}
              >
                <span className="icon">
                  {exportFormat === 'pdf' ? 'picture_as_pdf' : 'description'}
                </span> 
                Export {exportFormat.toUpperCase()}
              </button>
            </div>
          </div>

          <div className="history-list">
            {filteredHistory.length > 0 ? (
              filteredHistory.map(item => (
                <div key={item.id} className="history-item">
                  <div className="history-item-source">
                    <strong>Source:</strong> {item.sourceText}
                  </div>
                  <div className="history-item-translation">
                    <strong>Translation:</strong> {item.translatedText}
                  </div>
                </div>
              ))
            ) : (
              <p className="history-empty-placeholder">
                No history yet. Start a translation to see it here.
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}