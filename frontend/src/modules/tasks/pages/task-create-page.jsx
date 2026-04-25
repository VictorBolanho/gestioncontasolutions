import { useMemo } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { fetchCompanies } from "@/modules/companies/api/companies-api";
import { fetchTaxResponsibilities } from "@/modules/tax-responsibilities/api/tax-responsibilities-api";
import { createTask } from "@/modules/tasks/api/tasks-api";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { useTaskForm } from "@/modules/tasks/hooks/use-task-form";
import { fetchUsers } from "@/modules/users/api/users-api";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";

export function TaskCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { values, updateField, setComments } = useTaskForm();

  const [companiesQuery, usersQuery] = useQueries({
    queries: [
      { queryKey: ["companies", "task-form"], queryFn: () => fetchCompanies({ limit: 100 }) },
      { queryKey: ["users", "task-form"], queryFn: () => fetchUsers() }
    ]
  });

  const responsibilitiesQuery = useQuery({
    queryKey: ["tax-responsibilities", "task-form", values.companyId],
    queryFn: () => fetchTaxResponsibilities({ companyId: values.companyId, limit: 100 }),
    enabled: Boolean(values.companyId)
  });

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      navigate(`/tasks/${task._id}`);
    }
  });

  const companies = companiesQuery.data?.data || [];
  const users = usersQuery.data || [];
  const responsibilities = responsibilitiesQuery.data?.data || [];

  const normalizedComments = useMemo(
    () => values.comments.filter((item) => item.content.trim()).map((item) => ({ content: item.content.trim() })),
    [values.comments]
  );

  const handleCommentChange = (index, nextValue) => {
    const nextComments = values.comments.map((comment, currentIndex) =>
      currentIndex === index ? { content: nextValue } : comment
    );
    setComments(nextComments);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    createMutation.mutate({
      title: values.title,
      description: values.description,
      companyId: values.companyId,
      responsibilityId: values.responsibilityId || null,
      operationType: values.operationType,
      assignedTo: values.assignedTo,
      priority: values.priority,
      dueDate: values.dueDate,
      status: values.status,
      comments: normalizedComments
    });
  };

  if (companiesQuery.isLoading || usersQuery.isLoading) {
    return <LoadingPanel title="Preparando formulario" description="Cargando empresas, responsables y configuración inicial." />;
  }

  return (
    <>
      <TaskForm
        mode="create"
        values={values}
        companies={companies}
        users={users}
        responsibilities={responsibilities}
        onFieldChange={(field, value) => {
          updateField(field, value);
          if (field === "companyId") {
            updateField("responsibilityId", "");
          }
        }}
        onCommentChange={handleCommentChange}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />

      {createMutation.isError ? (
        <div className="panel border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {createMutation.error?.response?.data?.message || "No fue posible crear la tarea."}
        </div>
      ) : null}
    </>
  );
}
