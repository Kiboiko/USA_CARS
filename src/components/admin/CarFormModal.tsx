"use client";

import { useState } from "react";
import { adminUpload } from "@/lib/api";
import type { CarDetail, CarInput } from "@/lib/types";

// Add/edit car form (TZ §2.3). Includes photo upload via POST /api/admin/upload.

type Props = {
  token: string;
  initial?: CarDetail | null;
  onClose: () => void;
  onSave: (data: CarInput) => Promise<void>;
};

type Errors = Partial<Record<"make" | "model" | "year" | "price", string>>;

export default function CarFormModal({ token, initial, onClose, onSave }: Props) {
  const [make, setMake] = useState(initial?.make ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(String(initial?.year ?? ""));
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [mileage, setMileage] = useState(String(initial?.mileage ?? ""));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [sold, setSold] = useState(initial?.sold ?? false);
  const [errors, setErrors] = useState<Errors>({});
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  function validate(): Errors {
    const e: Errors = {};
    if (!make.trim()) e.make = "Required";
    if (!model.trim()) e.model = "Required";
    const y = Number(year);
    if (!y || y < 1950 || y > new Date().getFullYear() + 1) e.year = "Invalid year";
    if (!Number(price) || Number(price) < 0) e.price = "Invalid price";
    return e;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setServerError("");
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const { url } = await adminUpload(token, file);
        uploaded.push(url);
      }
      setPhotos((p) => [...p, ...uploaded]);
    } catch {
      setServerError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setServerError("");
    try {
      await onSave({
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        price: Number(price),
        mileage: Number(mileage) || 0,
        description: description.trim(),
        photos,
        sold,
      });
    } catch {
      setServerError("Could not save. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="head">
          <h3>{initial ? "Edit car" : "Add car"}</h3>
          <button className="btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="body">
            {serverError && <div className="alert alert-err">{serverError}</div>}

            <div className="form-grid">
              <div className={`field ${errors.make ? "invalid" : ""}`}>
                <label>Make</label>
                <input value={make} onChange={(e) => setMake(e.target.value)} />
                {errors.make && <span className="err-text">{errors.make}</span>}
              </div>
              <div className={`field ${errors.model ? "invalid" : ""}`}>
                <label>Model</label>
                <input value={model} onChange={(e) => setModel(e.target.value)} />
                {errors.model && <span className="err-text">{errors.model}</span>}
              </div>
              <div className={`field ${errors.year ? "invalid" : ""}`}>
                <label>Year</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
                {errors.year && <span className="err-text">{errors.year}</span>}
              </div>
              <div className={`field ${errors.price ? "invalid" : ""}`}>
                <label>Price (USD)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {errors.price && <span className="err-text">{errors.price}</span>}
              </div>
              <div className="field">
                <label>Mileage (mi)</label>
                <input
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                />
              </div>
            </div>

            <label className="check" style={{ marginTop: 4 }}>
              <input
                type="checkbox"
                checked={sold}
                onChange={(e) => setSold(e.target.checked)}
              />
              Sold — hide from the public inventory
            </label>

            <div className="field">
              <label>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Photos</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                disabled={uploading}
              />
              {uploading && (
                <span className="err-text" style={{ color: "var(--muted)" }}>
                  Uploading…
                </span>
              )}
              {photos.length > 0 && (
                <div className="photo-list">
                  {photos.map((src, i) => (
                    <div className="ph" key={`${src}-${i}`}>
                      <img src={src} alt={`Photo ${i + 1}`} />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() =>
                          setPhotos((p) => p.filter((_, idx) => idx !== i))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="foot">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
