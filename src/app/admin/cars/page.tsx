"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateCar,
  adminDeleteCar,
  adminGetCars,
  adminUpdateCar,
} from "@/lib/api";
import { useToken } from "@/lib/admin-auth";
import { carTitle, formatMileage, formatPrice } from "@/lib/format";
import type { CarDetail, CarInput } from "@/lib/types";
import CarFormModal from "@/components/admin/CarFormModal";

export default function AdminCarsPage() {
  const { token, ready } = useToken();
  const [cars, setCars] = useState<CarDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<CarDetail | null>(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setCars(await adminGetCars(token));
    } catch {
      setError("Could not load cars.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (ready && token) load();
  }, [ready, token, load]);

  function openAdd() {
    setEditing(null);
    setShowModal(true);
  }
  function openEdit(car: CarDetail) {
    setEditing(car);
    setShowModal(true);
  }

  async function handleSave(data: CarInput) {
    if (!token) return;
    if (editing) {
      await adminUpdateCar(token, editing.id, data);
    } else {
      await adminCreateCar(token, data);
    }
    setShowModal(false);
    await load();
  }

  async function handleDelete(car: CarDetail) {
    if (!token) return;
    if (!window.confirm(`Delete ${carTitle(car)}? This cannot be undone.`)) return;
    try {
      await adminDeleteCar(token, car.id);
      setCars((cs) => cs.filter((c) => c.id !== car.id));
    } catch {
      setError("Could not delete the car.");
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24 }}>Cars ({cars.length})</h1>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add car
        </button>
      </div>

      {error && <div className="alert alert-err" style={{ marginTop: 16 }}>{error}</div>}

      {loading ? (
        <div className="state">
          <div className="spinner" />
          Loading cars…
        </div>
      ) : cars.length === 0 ? (
        <div className="state">No cars yet. Click “Add car” to create one.</div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>ID</th>
                <th>Photo</th>
                <th>Car</th>
                <th>Year</th>
                <th>Price</th>
                <th>Mileage</th>
                <th>Photos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id}>
                  <td>{car.id}</td>
                  <td>
                    {car.photos[0] ? (
                      <img
                        src={car.photos[0]}
                        alt=""
                        style={{ width: 64, height: 42, objectFit: "cover", borderRadius: 6 }}
                      />
                    ) : (
                      <span className="tag">no photo</span>
                    )}
                  </td>
                  <td>
                    {car.make} {car.model}
                  </td>
                  <td>{car.year}</td>
                  <td>{formatPrice(car.price)}</td>
                  <td>{formatMileage(car.mileage)}</td>
                  <td>{car.photos.length}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn" onClick={() => openEdit(car)}>
                        Edit
                      </button>
                      <button className="btn btn-danger" onClick={() => handleDelete(car)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && token && (
        <CarFormModal
          token={token}
          initial={editing}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
