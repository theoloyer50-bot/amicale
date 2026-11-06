import { useState, useEffect } from 'react';
import { FileText, Download, X, Calendar } from 'lucide-react';
import { projectId } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3b9ea24b`;

interface Document {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  category: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface DocumentsProps {
  accessToken?: string;
  isModal?: boolean;
}

export function Documents({ accessToken, isModal = false }: DocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, load from localStorage
      const saved = localStorage.getItem('documents');
      if (saved) {
        const docs = JSON.parse(saved);
        setDocuments(docs);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Erreur lors du chargement des documents');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-red-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Chargement des documents...</p>
      </div>
    );
  }

  return (
    <div className={isModal ? '' : 'documents-section max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'}>
      <div className={isModal ? '' : 'bg-white rounded-2xl shadow-lg p-8'}>
        {/* Top title removed when embedded — documents are shown in MemberArea */}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Category filter removed — show all documents */}

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Aucun document disponible pour le moment
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <FileText className="w-5 h-5 text-red-700" />
                      </div>
                      <div>
                        <h3 className="text-lg text-gray-900">{doc.title}</h3>
                        {/* category badge removed */}
                      </div>
                    </div>
                    
                    {doc.description && (
                      <p className="text-gray-600 text-sm mb-3 ml-12">
                        {doc.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500 ml-12">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}
                      </span>
                      {doc.fileName && (
                        <span>📎 {doc.fileName}</span>
                      )}
                    </div>
                  </div>
                  
                  <a
                    href={doc.fileUrl}
                    download={doc.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}