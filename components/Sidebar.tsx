/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useSettings, useUI } from '../lib/state';
import c from 'classnames';
import { AVAILABLE_VOICES, AVAILABLE_LANGUAGES } from '../lib/constants';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { useHistoryStore } from '../lib/history';
import { jsPDF } from 'jspdf';

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUI();
  const {
    systemPrompt, voice, language1, language2, topic, autoDetectLanguage,
    setSystemPrompt, setVoice, setLanguage1, setLanguage2, setTopic, setAutoDetectLanguage
  } = useSettings();
  const { connected } = useLiveAPIContext();
  const { history, clearHistory } = useHistoryStore();

  const handleSave = () => {
    toggleSidebar();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Translation History', 10, 10);
    history.forEach((item, index) => {
      doc.text(`${index + 1}. Source: ${item.sourceText}`, 10, 20 + index * 10);
      doc.text(`   Translation: ${item.translatedText}`, 10, 25 + index * 10);
    });
    doc.save('history.pdf');
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
              System Prompt
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={10}
                placeholder="Describe the role and personality of the AI..."
              />
            </label>
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
            <label>
              Language 1
              <select value={language1} onChange={e => setLanguage1(e.target.value)}>
                {AVAILABLE_LANGUAGES.filter(lang => lang.value !== 'auto').map(lang => (
                  <option key={lang.value} value={lang.value}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Language 2
              <select value={language2} onChange={e => setLanguage2(e.target.value)}>
                {AVAILABLE_LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value === 'auto' ? 'Auto-Detect' : lang.value}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="tool-item" style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>
              <label className="tool-checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={autoDetectLanguage}
                  onChange={e => setAutoDetectLanguage(e.target.checked)}
                />
                <span className="checkbox-visual"></span>
              </label>
              <span className="tool-name-text" onClick={() => setAutoDetectLanguage(!autoDetectLanguage)}>Auto Detect Language</span>
            </div>
            <label>
              Topic (Optional)
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={4}
                placeholder="e.g., Discussing quarterly financial results, focusing on revenue growth and market expansion."
              />
            </label>
          </fieldset>
          <button
            onClick={handleSave}
            className="save-settings-button"
            disabled={connected}
          >
            Save Settings
          </button>
        </div>
        <div className="sidebar-section history-section">
          <div className="sidebar-section-title-wrapper">
            <h4 className="sidebar-section-title">Translation History</h4>
            <div className="sidebar-buttons">
              <button
                onClick={clearHistory}
                className="clear-history-button"
                disabled={history.length === 0}
                aria-label="Clear translation history"
              >
                <span className="icon">delete_sweep</span> Clear
              </button>
              <button
                onClick={exportToPDF}
                className="export-pdf-button"
                disabled={history.length === 0}
                aria-label="Export history to PDF"
              >
                <span className="icon">picture_as_pdf</span> Export PDF
              </button>
            </div>
          </div>
          <div className="history-list">
            {history.length > 0 ? (
              history.map(item => (
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