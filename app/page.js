"use client";

import { useState, useRef, useEffect } from "react";

export default function Component() {
  const [conflicts, setConflicts] = useState([]);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("Unresolved");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const modalRef = useRef(null);

  // Terms from backend
  useEffect(() => {
    const fetchConflicts = async () => {
      try {
        const response = await fetch(
          "https://pythonserver-1000521913987.europe-west2.run.app/terms"
        );
        const data = await response.json();
        // Ensure that each conflict has a terms array
        const formattedData = data.map((conflict) => ({
          ...conflict,
          terms: conflict.terms
            ? conflict.terms.split(",").map((term) => term.trim())
            : [],
        }));
        setConflicts(formattedData);
        console.log(formattedData);
      } catch (error) {
        console.error("Error fetching conflicts:", error);
      }
    };

    fetchConflicts();
  }, []);

  const handleResolve = (conflict) => {
    setSelectedConflict(conflict);
    setSelectedTerm(conflict.status === "Resolved" ? conflict.terms[0] : null);
    setSelectedStatus(conflict.status);
    setIsModalVisible(true);
  };

  const handleSaveChanges = () => {
    const updatedConflicts = conflicts.map((c) => {
      if (c.id === selectedConflict.id) {
        return {
          ...c,
          description: selectedConflict.description,
          terms: selectedConflict.terms,
          status: selectedStatus,
        };
      }
      return c;
    });
    setConflicts(updatedConflicts);
    closeModal();
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setSelectedConflict(null);
      setSelectedTerm(null);
      setSelectedStatus("Unresolved");
    }, 300); // Wait for the fade-out transition to complete
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTermChange = (index, value) => {
    const updatedTerms = [...selectedConflict.terms];
    updatedTerms[index] = value;
    setSelectedConflict({ ...selectedConflict, terms: updatedTerms });
  };

  const addTerm = () => {
    setSelectedConflict({
      ...selectedConflict,
      terms: [...selectedConflict.terms, ""],
    });
  };

  const removeTerm = (index) => {
    const updatedTerms = selectedConflict.terms.filter((_, i) => i !== index);
    setSelectedConflict({ ...selectedConflict, terms: updatedTerms });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Terminology Conflicts</h1>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-muted">
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left">Terms</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {conflicts.map((conflict) => (
              <tr key={conflict.id} className="border-b">
                <td className="px-4 py-3">{conflict.description}</td>
                <td className="px-4 py-3">
                  {conflict.terms &&
                    conflict.terms.map((term, index) => (
                      <span
                        key={index}
                        className={`inline-block bg-muted px-2 py-1 rounded-md mr-2 ${
                          conflict.status === "Resolved" && index === 0
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                      >
                        {term}
                      </span>
                    ))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 rounded-md ${
                      conflict.status === "inactive"
                        ? "bg-red-500 text-white"
                        : "bg-green-500 text-white"
                    }`}
                  >
                    {conflict.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleResolve(conflict)}
                  >
                    {conflict.status === "Resolved" ? "Edit" : "Resolve"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedConflict && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
            isModalVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div
            ref={modalRef}
            className={`bg-white p-6 rounded-lg shadow-lg w-full max-w-[425px] transition-all duration-300 ${
              isModalVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
          >
            <div className="mb-4">
              <h2 className="text-2xl font-bold">
                {selectedConflict.status === "Resolved" ? "Edit" : "Resolve"}{" "}
                Terminology Conflict
              </h2>
              <p className="text-muted-foreground">
                Update the description, edit terms, and set the status.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="grid items-center grid-cols-4 gap-4">
                <label htmlFor="description" className="text-right font-medium">
                  Description
                </label>
                <textarea
                  id="description"
                  value={selectedConflict.description}
                  onChange={(e) =>
                    setSelectedConflict({
                      ...selectedConflict,
                      description: e.target.value,
                    })
                  }
                  className="col-span-3 bg-muted rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid items-center grid-cols-4 gap-4">
                <label className="text-right font-medium">Terms</label>
                <div className="col-span-3 grid gap-2">
                  {selectedConflict.terms.map((term, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={term}
                        onChange={(e) =>
                          handleTermChange(index, e.target.value)
                        }
                        className="flex-grow bg-muted rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() => removeTerm(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addTerm}
                    className="text-primary hover:text-primary/80"
                  >
                    Add Term
                  </button>
                </div>
              </div>
              <div className="grid items-center grid-cols-4 gap-4">
                <label htmlFor="status" className="text-right font-medium">
                  Status
                </label>
                <select
                  id="status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="col-span-3 bg-muted rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Unresolved">active</option>
                  <option value="Resolved">inactive</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-primary/50"
                onClick={handleSaveChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
