import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";

function ProjectPage({ project, onBack }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const token = localStorage.getItem("token");

  const loadMaterials = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/materials/project/${project.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to load materials");
      }

      const data = await response.json();

      setMaterials(data);
    } catch (error) {
      console.error("Error loading materials:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [project.id]);

  const uploadMaterial = async () => {
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed.");
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", selectedFile);

      const response = await fetch(
        `/api/materials/project/${project.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Upload failed");
      }

      const uploadedMaterial = await response.json();

      setMaterials((previousMaterials) => [
        ...previousMaterials,
        uploadedMaterial,
      ]);

      setSelectedFile(null);

      document.getElementById("pdfInput").value = "";

    } catch (error) {
      console.error("Upload error:", error);
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    if (status === "READY") {
      return (
        <CheckCircle2
          size={18}
          className="text-green-600"
        />
      );
    }

    if (
      status === "PROCESSING" ||
      status === "QUEUED"
    ) {
      return (
        <Loader2
          size={18}
          className="text-indigo-600 animate-spin"
        />
      );
    }

    if (status === "FAILED") {
      return (
        <AlertCircle
          size={18}
          className="text-red-600"
        />
      );
    }

    return <FileText size={18} />;
  };

  const getStatusStyle = (status) => {
    if (status === "READY") {
      return "bg-green-50 text-green-700";
    }

    if (
      status === "PROCESSING" ||
      status === "QUEUED"
    ) {
      return "bg-indigo-50 text-indigo-700";
    }

    if (status === "FAILED") {
      return "bg-red-50 text-red-700";
    }

    return "bg-slate-100 text-slate-600";
  };

  return (
    <div>

      {/* BACK BUTTON */}

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6"
      >
        <ArrowLeft size={17} />
        Back to Space
      </button>


      {/* PROJECT HEADER */}

      <div className="bg-white border border-slate-200 rounded-2xl p-7 mb-6">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-sm text-indigo-600 font-medium">
              Learning Project
            </p>

            <h2 className="text-3xl font-bold mt-2">
              {project.name}
            </h2>

            <p className="text-slate-500 mt-2 max-w-2xl">
              {project.description ||
                "Build your knowledge by adding learning materials."}
            </p>

          </div>

          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">

            <FileText
              size={25}
              className="text-indigo-600"
            />

          </div>

        </div>

      </div>


      {/* UPLOAD SECTION */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">

        <div className="mb-5">

          <h3 className="text-lg font-bold">
            Learning Materials
          </h3>

          <p className="text-sm text-slate-500 mt-1">
            Upload PDF notes, textbooks, lecture slides,
            or study material.
          </p>

        </div>


        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8">

          <div className="text-center">

            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto">

              <Upload
                size={25}
                className="text-indigo-600"
              />

            </div>

            <h4 className="font-semibold mt-4">
              Upload a PDF
            </h4>

            <p className="text-sm text-slate-500 mt-1">
              Your material will be processed automatically.
            </p>


            <input
              id="pdfInput"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];

                if (file) {
                  setSelectedFile(file);
                }
              }}
            />

            <label
              htmlFor="pdfInput"
              className="inline-block mt-5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl text-sm font-medium"
            >
              Choose PDF
            </label>


            {selectedFile && (

              <div className="mt-5">

                <p className="text-sm font-medium">
                  {selectedFile.name}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>

                <button
                  onClick={uploadMaterial}
                  disabled={uploading}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2"
                >

                  {uploading && (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  {uploading
                    ? "Uploading..."
                    : "Upload Material"}

                </button>

              </div>

            )}

          </div>

        </div>

      </section>


      {/* MATERIAL LIST */}

      <section className="bg-white border border-slate-200 rounded-2xl p-6">

        <div className="flex items-center justify-between mb-5">

          <div>

            <h3 className="text-lg font-bold">
              Uploaded Materials
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Materials available to your AI learning companion.
            </p>

          </div>

          <span className="text-sm text-slate-500">
            {materials.length} material
            {materials.length !== 1 ? "s" : ""}
          </span>

        </div>


        {loading ? (

          <div className="py-10 text-center">

            <Loader2
              size={25}
              className="animate-spin mx-auto text-indigo-600"
            />

            <p className="text-sm text-slate-500 mt-3">
              Loading materials...
            </p>

          </div>

        ) : materials.length === 0 ? (

          <div className="py-10 text-center">

            <FileText
              size={40}
              className="mx-auto text-slate-300"
            />

            <p className="font-semibold mt-4">
              No materials yet
            </p>

            <p className="text-sm text-slate-500 mt-1">
              Upload your first PDF to start learning.
            </p>

          </div>

        ) : (

          <div className="space-y-3">

            {materials.map((material) => (

              <div
                key={material.id}
                className="flex items-center justify-between border border-slate-200 rounded-xl p-4"
              >

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">

                    <FileText
                      size={19}
                      className="text-slate-600"
                    />

                  </div>

                  <div>

                    <h4 className="font-semibold text-sm">
                      {material.fileName}
                    </h4>

                    <p className="text-xs text-slate-500 mt-1">
                      Uploaded{" "}
                      {material.uploadedAt
                        ? new Date(
                            material.uploadedAt
                          ).toLocaleString()
                        : ""}
                    </p>

                  </div>

                </div>


                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyle(
                    material.status
                  )}`}
                >

                  {getStatusIcon(material.status)}

                  {material.status}

                </div>

              </div>

            ))}

          </div>

        )}

      </section>

    </div>
  );
}

export default ProjectPage;