import { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, Edit2, X, Upload, Save } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  uploadedBy?: string;
}

export function DocumentsEditor() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fileName: '',
    fileUrl: ''
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = () => {
    const saved = localStorage.getItem('documents');
    if (saved) {
      try {
        setDocuments(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading documents:', error);
      }
    }
  };

  const saveDocuments = (docs: Document[]) => {
    localStorage.setItem('documents', JSON.stringify(docs));
    setDocuments(docs);
  };

  const handleAddDocument = () => {
    if (!formData.title || !formData.fileUrl) {
      alert('Le titre et le lien du fichier sont requis');
      return;
    }

    const newDoc: Document = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title,
      description: formData.description,
      fileName: formData.fileName || formData.title,
      fileUrl: formData.fileUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin'
    };

    saveDocuments([...documents, newDoc]);
    resetForm();
    setIsAddModalOpen(false);
  };

  const handleUpdateDocument = () => {
    if (!editingDoc || !formData.title || !formData.fileUrl) {
      alert('Le titre et le lien du fichier sont requis');
      return;
    }

    const updatedDocs = documents.map(doc =>
      doc.id === editingDoc.id
        ? {
            ...doc,
            title: formData.title,
            description: formData.description,
            fileName: formData.fileName || formData.title,
            fileUrl: formData.fileUrl,
            
          }
        : doc
    );

    saveDocuments(updatedDocs);
    resetForm();
    setEditingDoc(null);
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      saveDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const openEditModal = (doc: Document) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      description: doc.description,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      fileName: '',
      fileUrl: ''
    });
  };

  const handleFileChosen = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData(prev => ({
        ...prev,
        fileName: file.name,
        fileUrl: result
      }));
    };
    reader.onerror = (err) => {
      console.error('File read error', err);
      alert('Erreur lors de la lecture du fichier');
    };
    reader.readAsDataURL(file);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingDoc(null);
    resetForm();
  };

  // categories removed

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-red-700" />
          <h3 className="text-xl text-gray-900">Gestion des Documents</h3>
        </div>
        <button
          onClick={() => {
            setIsAddModalOpen(true);
            // open file explorer immediately
            setTimeout(() => fileInputRef.current?.click(), 50);
          }}
          className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un document
        </button>
      </div>

      {/* hidden file input used for picker */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handleFileChosen(f);
            // keep modal open
            setIsAddModalOpen(true);
          }
        }}
      />

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Aucun document. Ajoutez-en un pour commencer.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-gray-900">{doc.title}</h4>
                </div>
                {doc.description && (
                  <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>📎 {doc.fileName}</span>
                  <span>📅 {new Date(doc.uploadedAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(doc)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(isAddModalOpen || editingDoc) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-red-700 to-red-800 text-white px-8 py-6 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                {editingDoc ? <Edit2 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                <h2 className="text-2xl">
                  {editingDoc ? 'Modifier le document' : 'Ajouter un document'}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">
                  Titre du document *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Règlement intérieur 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description du document (optionnel)"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                />
              </div>

              {/* Category removed per request */}

              <div>
                <label className="block text-gray-700 mb-2">
                  Nom du fichier (optionnel)
                </label>
                <input
                  type="text"
                  value={formData.fileName}
                  onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                  placeholder="Ex: reglement-interieur-2024.pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-700 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Fichier *
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                    const f = e.dataTransfer?.files?.[0];
                    if (f) handleFileChosen(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${isDragActive ? 'border-red-700 bg-red-50' : 'border-gray-200 bg-white'}`}
                >
                  {formData.fileName ? (
                    <div className="flex items-center justify-center gap-3">
                      <Upload className="w-5 h-5 text-red-700" />
                      <div className="text-sm text-gray-800">
                        <div className="font-medium">{formData.fileName}</div>
                        <div className="text-xs text-gray-500">Cliquer ou déposer un autre fichier pour remplacer</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Glisser-déposer un fichier ici, ou cliquer pour ouvrir l'explorateur
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  💡 Conseil : Vous pouvez déposer un PDF ou autre fichier. Le fichier sera stocké localement dans votre navigateur.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={editingDoc ? handleUpdateDocument : handleAddDocument}
                  className="flex-1 px-6 py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingDoc ? 'Enregistrer les modifications' : 'Ajouter le document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
