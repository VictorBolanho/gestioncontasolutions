import { useMemo, useState } from "react";

export function useTaskForm(initialValues = {}) {
  const baseState = useMemo(
    () => ({
      title: initialValues.title || "",
      description: initialValues.description || "",
      companyId: initialValues.company?._id || initialValues.companyId || "",
      responsibilityId: initialValues.taxResponsibility?._id || initialValues.responsibilityId || "",
      assignedTo: initialValues.assignedTo?._id || initialValues.assignedTo || "",
      priority: initialValues.priority || "MEDIUM",
      dueDate: initialValues.dueDate ? new Date(initialValues.dueDate).toISOString().slice(0, 10) : "",
      status: initialValues.status || "PENDING",
      comments: initialValues.comments?.length
        ? initialValues.comments.map((item) => ({ content: item.content }))
        : [{ content: "" }],
      comment: ""
    }),
    [initialValues]
  );

  const [values, setValues] = useState(baseState);

  const updateField = (name, value) => {
    setValues((current) => ({
      ...current,
      [name]: value
    }));
  };

  const setComments = (comments) => {
    setValues((current) => ({
      ...current,
      comments
    }));
  };

  return {
    values,
    setValues,
    updateField,
    setComments
  };
}
