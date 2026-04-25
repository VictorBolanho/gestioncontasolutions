import { useEffect } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { fetchCompanies } from "@/modules/companies/api/companies-api";
import { fetchTaxResponsibilities } from "@/modules/tax-responsibilities/api/tax-responsibilities-api";
import { fetchTaskById, updateTask } from "@/modules/tasks/api/tasks-api";
import { TaskForm } from "@/modules/tasks/components/task-form";
import { useTaskForm } from "@/modules/tasks/hooks/use-task-form";
import { fetchUsers } from "@/modules/users/api/users-api";
import { LoadingPanel } from "@/shared/components/feedback/loading-panel";

export function TaskEditPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const taskQuery = useQuery({
    queryKey: ["tasks", "detail", taskId],
    queryFn: () => fetchTaskById(taskId)
  });

  const [companiesQuery, usersQuery] = useQueries({
    queries: [
      { queryKey: ["companies", "task-form"], queryFn: () => fetchCompanies({ limit: 100 }) },
      { queryKey: ["users", "task-form"], queryFn: () => fetchUsers() }
    ]
  });

  const { values, setValues, updateField } = useTaskForm(taskQuery.data || {});

  useEffect(() => {
    if (taskQuery.data) {
      setValues({
        title: taskQuery.data.title || "",
        description: taskQuery.data.description || "",
        companyId: taskQuery.data.company?._id || "",
        responsibilityId: taskQuery.data.taxResponsibility?._id || "",
        assignedTo: taskQuery.data.assignedTo?._id || "",
        priority: taskQuery.data.priority || "MEDIUM",
        dueDate: taskQuery.data.dueDate ? new Date(taskQuery.data.dueDate).toISOString().slice(0, 10) : "",
        status: taskQuery.data.status || "PENDING",
        comments: [],
        comment: ""
      });
    }
  }, [setValues, taskQuery.data]);

  const responsibilitiesQuery = useQuery({
    queryKey: ["tax-responsibilities", "task-form", values.companyId],
    queryFn: () => fetchTaxResponsibilities({ companyId: values.companyId, limit: 100 }),
    enabled: Boolean(values.companyId)
  });

  const updateMutation = useMutation({
    mutationFn: (payload) => updateTask(taskId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "detail", taskId] });
      navigate(`/tasks/${taskId}`);
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();

    updateMutation.mutate({
      title: values.title,
      description: values.description,
      companyId: values.companyId,
      responsibilityId: values.responsibilityId || null,
      assignedTo: values.assignedTo,
      priority: values.priority,
      dueDate: values.dueDate,
      status: values.status,
      ...(values.comment.trim() ? { comment: values.comment.trim() } : {})
    });
  };

  if (taskQuery.isLoading || companiesQuery.isLoading || usersQuery.isLoading || !taskQuery.data) {
    return <LoadingPanel title="Cargando tarea" description="Preparando la edición operativa." />;
  }

  return (
    <>
      <TaskForm
        mode="edit"
        values={values}
        companies={companiesQuery.data?.data || []}
        users={usersQuery.data || []}
        responsibilities={responsibilitiesQuery.data?.data || []}
        onFieldChange={(field, value) => {
          updateField(field, value);
          if (field === "companyId") {
            updateField("responsibilityId", "");
          }
        }}
        onCommentChange={() => {}}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />

      {updateMutation.isError ? (
        <div className="panel border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {updateMutation.error?.response?.data?.message || "No fue posible actualizar la tarea."}
        </div>
      ) : null}
    </>
  );
}
