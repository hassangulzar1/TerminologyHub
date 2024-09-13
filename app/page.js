"use client";

import { useState, useRef, useEffect } from "react";

export default function Component() {
  //! State declarations
  const [conflicts, setConflicts] = useState([]);
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [preferredTerm, setPreferredTerm] = useState(null);
  const [isNewConcept, setIsNewConcept] = useState(false);
  const modalRef = useRef(null);

  //! Fetch conflicts from the backend
  useEffect(() => {
    const fetchConflicts = async () => {
      try {
        const response = await fetch(
          "https://pythonserver-1000521913987.europe-west2.run.app/all-concepts"
        );
        const data = await response.json();
        setConflicts(data);
      } catch (error) {
        console.error("Error fetching conflicts:", error);
      }
    };

    fetchConflicts();
  }, [preferredTerm]);

  //! Handle saving changes to a conflict or adding a new concept
  const handleSaveChanges = async () => {
    if (!selectedConflict) return;

    if (isNewConcept) {
      // Add new concept
      try {
        const response = await fetch(
          "https://pythonserver-1000521913987.europe-west2.run.app//concepts",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              description: selectedConflict.description,
              terms: selectedConflict.terms,
              preferred_term: preferredTerm,
              status: selectedStatus,
            }),
          }
        );

        if (!response.ok) throw new Error("Failed to add new concept");
        const newConcept = await response.json();
        setConflicts((prevConflicts) => [...prevConflicts, newConcept]);
        console.log("New concept added successfully");
      } catch (error) {
        console.error("Error adding new concept:", error);
      }
    } else {
      // Update existing conflict
      setConflicts((prevConflicts) =>
        prevConflicts.map((c) =>
          c.id === selectedConflict.id
            ? {
                ...c,
                ...selectedConflict,
                status: selectedStatus,
                preferredTerm,
              }
            : c
        )
      );

      //! Update preferred term on the backend
      if (preferredTerm) {
        try {
          const response = await fetch(
            `https://pythonserver-1000521913987.europe-west2.run.app/concept/${selectedConflict.id}/preferred-term`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ preferred_term: preferredTerm }),
            }
          );

          if (!response.ok) throw new Error("Failed to update preferred term");
          console.log("Preferred term updated successfully");
        } catch (error) {
          console.error("Error updating preferred term:", error);
        }
      }
      //! Update Status on the backend
      if (selectedStatus) {
        try {
          const response = await fetch(
            `https://pythonserver-1000521913987.europe-west2.run.app/update-status/${selectedConflict.id}`,
            {
              method: "PUT",
              headers: {
                accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: selectedStatus }),
            }
          );

          if (!response.ok) throw new Error("Failed to update status");
          console.log("Status updated successfully");
        } catch (error) {
          console.error("Error updating status:", error);
        }
      }
    }
    closeModal();
  };

  //! Update terms for a conflict
  const updateTerms = async () => {
    if (!selectedConflict) return;

    try {
      const response = await fetch(
        `https://pythonserver-1000521913987.europe-west2.run.app/concept/${selectedConflict.id}/update-terms`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ terms: selectedConflict.terms }),
        }
      );

      if (!response.ok) throw new Error("Failed to update terms");

      const updatedConflict = await response.json();
      setConflicts((prevConflicts) =>
        prevConflicts.map((conflict) =>
          conflict.id === updatedConflict.id ? updatedConflict : conflict
        )
      );
    } catch (error) {
      console.error("Error updating terms:", error);
    }
  };

  useEffect(() => {
    if (selectedConflict?.terms && !isNewConcept) {
      updateTerms();
    }
  }, [selectedConflict]);

  //! Handle resolving or editing a conflict
  const handleResolve = (conflict) => {
    setSelectedConflict({
      ...conflict,
      terms: conflict.terms || [],
    });
    setSelectedStatus(conflict.status);
    setPreferredTerm(conflict.preferredTerm || null);
    setIsModalVisible(true);
    setIsNewConcept(false);
  };

  //! Handle adding a new concept
  const handleAddNewConcept = () => {
    setSelectedConflict({
      description: "",
      terms: [""],
    });
    setSelectedStatus("not resolved");
    setPreferredTerm(null);
    setIsModalVisible(true);
    setIsNewConcept(true);
  };

  // Modal management
  const closeModal = () => {
    setIsModalVisible(false);
    setTimeout(() => {
      setSelectedConflict(null);
      setPreferredTerm(null);
      setIsNewConcept(false);
    }, 300);
  };

  const handleClickOutside = (event) => {
    if (modalRef.current && !modalRef.current.contains(event.target)) {
      closeModal();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //! Term management
  const handleTermChange = (index, value) => {
    setSelectedConflict((prev) => ({
      ...prev,
      terms: prev.terms.map((term, i) => (i === index ? value : term)),
    }));
  };

  const addTerm = () => {
    if (selectedConflict.terms.length < 4) {
      setSelectedConflict((prev) => ({
        ...prev,
        terms: [...prev.terms, ""],
      }));
    }
  };

  const removeTerm = (index) => {
    setSelectedConflict((prev) => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== index),
    }));
    if (preferredTerm === selectedConflict.terms[index]) {
      setPreferredTerm(null);
    }
  };

  //! Render component
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Terminology Conflicts</h1>
        <button
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleAddNewConcept}
        >
          Add New Concept
        </button>
      </div>
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
                  {conflict.terms?.map((term, index) => (
                    <span
                      key={index}
                      className={`inline-block bg-muted px-2 py-1 rounded-md mr-2 ${
                        conflict.preferred_term === term
                          ? "bg-black text-white"
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
                      conflict.status === "not resolved"
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
                {isNewConcept
                  ? "Add New Concept"
                  : selectedConflict.status === "Resolved"
                  ? "Edit"
                  : "Resolve"}{" "}
                Terminology Conflict
              </h2>
              <p className="text-muted-foreground">
                {isNewConcept
                  ? "Add a new concept"
                  : "Update the description, edit terms, and set the status."}
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
                    setSelectedConflict((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
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
                  {selectedConflict.terms.length < 4 && (
                    <button
                      onClick={addTerm}
                      className="text-primary hover:text-primary/80"
                    >
                      Add Term
                    </button>
                  )}
                </div>
              </div>
              <div className="grid items-center grid-cols-4 gap-4">
                <label className="text-right font-medium">Preferred Term</label>
                <div className="col-span-3 grid gap-2">
                  {selectedConflict.terms.map((term, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        id={`term-${index}`}
                        name="preferredTerm"
                        value={term}
                        checked={
                          preferredTerm === term ||
                          (selectedConflict.preferred_term === term &&
                            !preferredTerm)
                        }
                        onChange={() => setPreferredTerm(term)}
                        className="mr-2"
                      />
                      <label htmlFor={`term-${index}`}>{term}</label>
                    </div>
                  ))}
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
                  <option value="resolved">Resolved</option>
                  <option value="not resolved">Not Resolved</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-1 focus:ring-primary/50"
                onClick={handleSaveChanges}
              >
                {isNewConcept ? "Add Concept" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
