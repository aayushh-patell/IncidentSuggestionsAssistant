import React, { useState, useEffect } from 'react';
import { Upload, Clock, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface Incident {
  id: string;
  title: string;
  created_at: string;
}

// Height of the navbar/header (measured: 112px)
export const NAVBAR_HEIGHT = 112;

// Helper: Paste JSON Incident Modal
function PasteIncidentModal({
  show,
  onClose,
  onSubmit,
  isLoading,
  incidentTitle,
  setIncidentTitle,
  pastedJson,
  setPastedJson,
  pasteError,
}: {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  incidentTitle: string;
  setIncidentTitle: (v: string) => void;
  pastedJson: string;
  setPastedJson: (v: string) => void;
  pasteError: string;
}) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-lg relative">
        <div className="rounded-xl bg-anthropicCard border border-anthropicAccent1 shadow-lg">
          <CardContent className="p-8 relative">
            <button className="absolute top-4 right-4 text-muted-foreground hover:text-black transition-colors text-2xl font-bold" onClick={onClose} aria-label="Close modal">&times;</button>
            <h2 className="text-2xl font-bold text-ink mb-4">Paste Incident JSON</h2>
            <input
              type="text"
              className="w-full border border-[#E0DED8] rounded-md px-3 py-2 mb-3 font-sans text-base bg-anthropicCard text-ink placeholder:text-muted-foreground placeholder:font-sans placeholder:text-base focus:outline-none focus:ring-2 focus:ring-anthropicAccent1 transition-all"
              placeholder="Incident Title (optional)"
              value={incidentTitle}
              onChange={e => setIncidentTitle(e.target.value)}
              disabled={isLoading}
            />
            <textarea
              id="incident-json"
              name="incident-json"
              className="w-full h-48 border border-[#E0DED8] rounded-md px-3 py-2 mb-3 font-mono text-sm bg-anthropicCard text-ink placeholder:text-muted-foreground placeholder:font-sans placeholder:text-base focus:outline-none focus:ring-2 focus:ring-anthropicAccent1 transition-all"
              value={pastedJson}
              onChange={e => setPastedJson(e.target.value)}
              placeholder="Paste incident JSON here"
              disabled={isLoading}
            />
            {pasteError && <div className="text-red-600 mb-2 font-medium">{pasteError}</div>}
            <div className="flex gap-2 justify-end mt-4">
              <Button onClick={onSubmit} disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 py-2 rounded-md shadow-sm">
                {isLoading ? 'Processing...' : 'Submit'}
              </Button>
              <Button variant="outline" onClick={onClose} disabled={isLoading} className="font-bold px-5 py-2 rounded-md transition-colors hover:bg-black hover:text-anthropicCard hover:border-black">
                Cancel
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [incidentTitle, setIncidentTitle] = useState('');

  useEffect(() => {
    fetch('/api/incidents')
      .then(res => res.json())
      .then(data => setIncidents(Array.isArray(data) ? data : []));
  }, []);

  // Handle paste modal submit
  const handlePasteSubmit = async () => {
    setPasteError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/transcript_messages/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: JSON.parse(pastedJson), title: incidentTitle }),
      });
      if (!res.ok) throw new Error('Paste failed');
      const data = await res.json();
      setShowPasteModal(false);
      setIsLoading(false);
      setPastedJson('');
      setIncidentTitle('');
      navigate(`/incident-analysis/${data.incident_id}`);
    } catch (err) {
      setPasteError('Failed to start analysis.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-anthropicBg font-anthropic p-0">
      {/* Header */}
      <header className="border-b border-border bg-anthropicCard">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-ink">Incident Response Assistant</h1>
              <p className="text-base text-muted-foreground mt-1">AI-powered incident analysis and response</p>
            </div>
          </div>
        </div>
      </header>
      {/* Paste Modal */}
      <PasteIncidentModal
        show={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onSubmit={handlePasteSubmit}
        isLoading={isLoading}
        incidentTitle={incidentTitle}
        setIncidentTitle={setIncidentTitle}
        pastedJson={pastedJson}
        setPastedJson={setPastedJson}
        pasteError={pasteError}
      />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="rounded-xl bg-anthropicCard shadow-md p-6 w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-ink">{incidents.length}</div>
            </CardContent>
          </Card>
          {/* Paste JSON Incident Inverted Card */}
          <Card className="rounded-xl bg-black shadow-md p-6 w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">Add New Incident</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white mb-4">Paste a JSON transcript to start a new analysis.</div>
              <Button onClick={() => setShowPasteModal(true)} className="bg-white text-black hover:bg-gray-100 font-bold px-5 py-2 rounded-md shadow-sm border border-white">
                Paste JSON Incident
              </Button>
            </CardContent>
          </Card>
        </div>
        {/* Incidents List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-ink mb-4">Recent Incidents</h2>
          {incidents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((incident) => (
            <Card key={incident.id} className="rounded-xl bg-anthropicCard shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200 p-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-ink">{incident.title}</h3>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground font-medium">
                      <Clock className="w-4 h-4 mr-1" />
                      {new Date(incident.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="ml-6">
                    <Button
                      className="bg-anthropicCard border border-[#E0DED8] text-black hover:bg-black hover:text-anthropicCard hover:border-black transition-colors font-medium rounded-md px-4 py-2 flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200"
                      onClick={() => navigate(`/incident-analysis/${incident.id}`)}
                    >
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Empty State */}
        {incidents.length === 0 && (
          <Card className="rounded-xl bg-anthropicCard shadow-md hover:shadow-lg hover:scale-[1.01] transition-all duration-200">
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-bold text-ink mb-2">No incidents uploaded</h3>
              <p className="text-base text-muted-foreground mb-4">Upload JSON incident data above to begin analysis</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;