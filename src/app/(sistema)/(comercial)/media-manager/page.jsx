"use client";
import { PageHeader, Button } from '@/components/ui';
import { useState, useEffect, useRef } from "react";
import {
  Upload,
  AlertCircle,
  HardDrive,
  ChevronRight,
  Home,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useApi } from "@/hooks/useApi";
import {
  getImages,
  uploadImage,
  deleteImage,
  getOrphans,
  bulkAssignImages,
  updateImage,
} from "@/services/apis/media.js";
import { getFullImageUrl } from "@/services/apis/catalogo.js";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";
import DirectoriesPanel from "@/components/comercial/media-manager/DirectoriesPanel";
import ExplorerPanel from "@/components/comercial/media-manager/ExplorerPanel";

export default function MediaManagerPage() {
  const { showToast } = useToast();
  const { confirm, danger } = useConfirm();
  const [carpetaActual, setCarpetaActual] = useState("root");
  const [breadcrumbs, setBreadcrumbs] = useState([
    { id: "root", nombre: "Raíz" },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const searchTermDebounced = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const [isAuditing, setIsAuditing] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [uploadProgress, setUploadProgress] = useState({
    current: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Cargar archivos con useApi
  const {
    data: archivosData,
    execute: loadArchivos,
  } = useApi(isAuditing ? getOrphans : getImages, {
    auto: false,
    initialData: { results: [], count: 0 },
    args: carpetaActual
      ? [carpetaActual, { page, search: searchTermDebounced }]
      : [null, { page, search: searchTermDebounced }],
  });

  const archivos = archivosData?.results || archivosData || [];
  const count = archivosData?.count || 0;

  const handleAuditOrphans = () => {
    if (isAuditing) {
      setIsAuditing(false);
      setCarpetaActual("root");
      setBreadcrumbs([{ id: "root", nombre: "Raíz" }]);
    } else {
      setIsAuditing(true);
      setCarpetaActual(null);
    }
    setPage(1);
  };

  // Efecto principal para cargar datos
  useEffect(() => {
    if (carpetaActual || isAuditing) {
      loadArchivos(isAuditing ? null : carpetaActual, {
        page,
        search: searchTermDebounced,
      });
    }
  }, [carpetaActual, page, searchTermDebounced, isAuditing]);

  // Resetear a página 1 cuando cambia la carpeta, la búsqueda o el modo auditoría
  useEffect(() => {
    setPage(1);
  }, [carpetaActual, searchTermDebounced, isAuditing]);

  const navigateToFolder = (folder) => {
    setIsAuditing(false);
    setCarpetaActual(folder.id);
    setArchivoSeleccionado(null);
    setPage(1);
    const idx = breadcrumbs.findIndex((b) => b.id === folder.id);
    if (idx >= 0) {
      setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
    } else {
      setBreadcrumbs([
        ...breadcrumbs,
        { id: folder.id, nombre: folder.name || folder.nombre },
      ]);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setLoading(true);
    setUploadProgress({ current: 0, total: files.length });
    let successes = 0;
    let failures = 0;

    try {
      const CHUNK_SIZE = 1;
      for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        setUploadProgress((prev) => ({ ...prev, current: i + 1 }));
        const chunk = files.slice(i, i + CHUNK_SIZE);
        const results = await Promise.allSettled(
          chunk.map((file) => uploadImage(file, carpetaActual)),
        );

        results.forEach((res) => {
          if (res.status === "fulfilled") successes++;
          else {
            failures++;
            console.error("Error en subida individual:", res.reason);
          }
        });
      }

      if (failures > 0) {
        showToast(
          `Proceso de subida completada: ${successes} archivos subidos, ${failures} fallaron.`,
          "info"
        );
      } else {
        showToast(`✅ ${successes} archivos subidos con éxito`, "success");
      }

      loadArchivos(carpetaActual, { page, search: searchTermDebounced });
    } catch (error) {
      console.error("Error crítico subiendo archivos:", error);
      showToast("Ocurrió un error inesperado durante la subida.", "error");
    } finally {
      setLoading(false);
      setUploadProgress({ current: 0, total: 0 });
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await danger(
      "¿Estás seguro de eliminar este archivo?",
      "Eliminar archivo"
    );
    
    if (!isConfirmed) return;
    
    try {
      await deleteImage(id);
      if (archivoSeleccionado?.id === id) setArchivoSeleccionado(null);
      loadArchivos(isAuditing ? null : carpetaActual, { page, search: searchTermDebounced });
      showToast("Archivo eliminado con éxito", "success");
    } catch (error) {
      showToast("Error al eliminar el archivo", "error");
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedItems([]);
    setArchivoSeleccionado(null);
  };

  const toggleItemSelection = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleSelectAll = () => {
    const allIds = archivos.map((a) => a.id);
    if (selectedItems.length === allIds.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(allIds);
    }
  };

  const handleBulkDelete = async () => {
    const isConfirmed = await danger(
      `¿Estás seguro de eliminar ${selectedItems.length} archivos?`,
      "Eliminar múltiples archivos"
    );
    
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      await Promise.all(selectedItems.map((id) => deleteImage(id)));
      setSelectedItems([]);
      setIsSelectionMode(false);
      loadArchivos(isAuditing ? null : carpetaActual, { page, search: searchTermDebounced });
      showToast(`${selectedItems.length} archivos eliminados con éxito`, "success");
    } catch (error) {
      showToast("Error al eliminar algunos archivos", "error");
      loadArchivos(isAuditing ? null : carpetaActual, { page, search: searchTermDebounced });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAssign = async (varianteId, targetType) => {
    const isConfirmed = await confirm(
      `¿Estás seguro de asignar ${selectedItems.length} imágenes a la variante ${varianteId}?`,
      "Asignar imágenes"
    );
    
    if (!isConfirmed) return;
    
    setLoading(true);
    try {
      await bulkAssignImages(selectedItems, varianteId, targetType);
      showToast("Acción completada con éxito", "success");
      setShowBulkAssignModal(false);
      setSelectedItems([]);
      setIsSelectionMode(false);
      loadArchivos(carpetaActual, { page, search: searchTermDebounced });
    } catch (error) {
      console.error("Error al asignar imágenes:", error);
      const msg = typeof error === "object" ? JSON.stringify(error) : error;
      showToast(`Error al asignar imágenes: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const startEditingImage = async () => {
    setEditFormData({
      name: archivoSeleccionado.name,
      default_alt_text: archivoSeleccionado.default_alt_text || "",
      default_caption: archivoSeleccionado.default_caption || "",
      folder: archivoSeleccionado.folder || "root",
    });
    setIsEditingImage(true);
  };

  const handleSaveImageInfo = async () => {
    setLoading(true);
    try {
      const dataToSave = { ...editFormData };
      if (dataToSave.folder === "root") dataToSave.folder = null;

      const updated = await updateImage(archivoSeleccionado.id, dataToSave);
      setArchivoSeleccionado(updated);
      setIsEditingImage(false);
      showToast("Información de la imagen actualizada", "success");
      loadArchivos(carpetaActual, { page, search: searchTermDebounced });
    } catch (error) {
      console.error("Error actualizando imagen:", error);
      const msg = typeof error === "object" ? JSON.stringify(error) : error;
      showToast(`Error al actualizar la información de la imagen: ${msg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, id) => {
    if (selectedItems.includes(id)) {
      e.dataTransfer.setData("imageIds", JSON.stringify(selectedItems));
    } else {
      e.dataTransfer.setData("imageIds", JSON.stringify([id]));
    }
  };

  const handleDrop = async (e, folderId) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("imageIds");
    if (!data) return;

    try {
      const ids = JSON.parse(data);
      const targetFolder = folderId === "root" ? null : folderId;

      setLoading(true);
      await Promise.all(
        ids.map((id) => updateImage(id, { folder: targetFolder })),
      );

      setSelectedItems([]);
      setIsSelectionMode(false);
      showToast("Archivos movidos con éxito", "success");
      loadArchivos(carpetaActual, { page, search: searchTermDebounced });
    } catch (error) {
      console.error("Error moviendo archivos:", error);
      showToast("Error al mover los archivos seleccionados", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("URL copiada al portapapeles", "success");
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* Cabecera */}
      <PageHeader
        title="Gestor de Medios"
        subtitle={
          <>
            <HardDrive size={12} /> Almacenamiento y Archivos
          </>
        }
        subtitleClassName="text-emerald-600"
      >
        <Button
          onClick={handleUploadClick}
          icon={Upload}
          size="sm"
          className="bg-slate-900 hover:bg-slate-800 text-white border-none shadow-sm rounded-xl px-5 py-2.5 font-bold active:scale-95"
        >
          SUBIR ARCHIVO
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          multiple
        />
      </PageHeader>

      <main className="flex-1 overflow-hidden flex flex-col min-w-0 p-4 gap-4 max-w-[1700px] mx-auto w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          {isAuditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsAuditing(false);
                  setCarpetaActual("root");
                  setBreadcrumbs([{ id: "root", nombre: "Raíz" }]);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                <Home size={14} />
              </button>
              <ChevronRight size={12} className="text-slate-300" />
              <span className="text-xs font-black uppercase text-amber-600 flex items-center gap-1">
                <AlertCircle size={12} /> Auditoría de Huérfanas
              </span>
            </div>
          ) : (
            breadcrumbs.map((b, idx) => (
              <div key={b.id} className="flex items-center gap-2">
                <button
                  onClick={() => navigateToFolder(b)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, b.id)}
                  className={`text-xs font-bold transition-colors p-1 rounded hover:bg-slate-50 ${carpetaActual === b.id ? "text-emerald-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  {b.id === "root" ? <Home size={14} /> : b.nombre}
                </button>
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight size={12} className="text-slate-300" />
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex-1 flex gap-4 min-h-0">
          <DirectoriesPanel
            carpetaActual={carpetaActual}
            navigateToFolder={navigateToFolder}
            handleDrop={handleDrop}
            handleDragOver={handleDragOver}
            handleAuditOrphans={handleAuditOrphans}
            isAuditing={isAuditing}
          />

          <ExplorerPanel
            archivos={archivos}
            loading={loading}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            count={count}
            pageSize={pageSize}
            page={page}
            setPage={setPage}
            isSelectionMode={isSelectionMode}
            toggleSelectionMode={toggleSelectionMode}
            handleSelectAll={handleSelectAll}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            toggleItemSelection={toggleItemSelection}
            uploadProgress={uploadProgress}
            handleDragStart={handleDragStart}
            archivoSeleccionado={archivoSeleccionado}
            setArchivoSeleccionado={setArchivoSeleccionado}
            isEditingImage={isEditingImage}
            setIsEditingImage={setIsEditingImage}
            handleDelete={handleDelete}
            getFullImageUrl={getFullImageUrl}
            formatFileSize={formatFileSize}
            startEditingImage={startEditingImage}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            handleSaveImageInfo={handleSaveImageInfo}
            copyToClipboard={copyToClipboard}
            showBulkAssignModal={showBulkAssignModal}
            setShowBulkAssignModal={setShowBulkAssignModal}
            handleBulkDelete={handleBulkDelete}
            handleBulkAssign={handleBulkAssign}
          />
        </div>
      </main>
    </div>
  );
}
