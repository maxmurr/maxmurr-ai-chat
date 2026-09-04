"use client";

import { useForm } from "@tanstack/react-form";
import { CircleAlertIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import {
  getWorkspaceCreationFieldError,
  MAX_WORKSPACE_CREATION_MEMBERS,
  type WorkspaceCreationFormMember,
  type WorkspaceCreationMemberRole,
  validateWorkspaceCreationMemberEmail,
  validateWorkspaceCreationMembers,
  validateWorkspaceCreationName,
} from "@/features/workspace/workspace-creation-validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { createWorkspaceAction } from "@/features/workspace/workspace-actions";
import { cn } from "@/lib/utils";

type WorkspaceCreationFormValues = {
  workspace: {
    identity: {
      name: string;
    };
    access: {
      members: WorkspaceCreationFormMember[];
    };
  };
};

type CreateWorkspaceDialogProps = {
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

const defaultWorkspaceCreationFormValues: WorkspaceCreationFormValues = {
  workspace: {
    identity: {
      name: "",
    },
    access: {
      members: [],
    },
  },
};

function useWorkspaceCreationForm({
  onCreated,
  onSubmissionError,
}: {
  onCreated: () => void;
  onSubmissionError: (message: string | null) => void;
}) {
  const form = useForm({
    defaultValues: defaultWorkspaceCreationFormValues,
    onSubmit: async ({ value }) => {
      onSubmissionError(null);

      try {
        const result = await createWorkspaceAction({
          name: value.workspace.identity.name.trim(),
          members: value.workspace.access.members.map(({ email, role }) => ({
            email: email.trim(),
            role,
          })),
        });

        if (!result.ok) {
          onSubmissionError(result.error);
          return;
        }

        toast.add({
          description:
            result.failedInvitationEmails.length > 0
              ? `Could not invite ${new Intl.ListFormat("en").format(result.failedInvitationEmails)}.`
              : value.workspace.access.members.length > 0
                ? `${value.workspace.access.members.length} invitation${value.workspace.access.members.length === 1 ? "" : "s"} created.`
                : `${result.workspace.name} is ready.`,
          title:
            result.failedInvitationEmails.length > 0
              ? "Workspace created; some invitations failed"
              : "Workspace created",
          type:
            result.failedInvitationEmails.length > 0 ? "warning" : "success",
        });
      } catch (error) {
        console.error("Workspace creation failed", error);
        onSubmissionError("Could not create workspace. Try again.");
        return;
      }

      form.reset();
      onCreated();
    },
  });

  return form;
}

type WorkspaceCreationFormApi = ReturnType<typeof useWorkspaceCreationForm>;

function WorkspaceCreationMembersFieldset({
  className,
  form,
}: {
  className?: string;
  form: WorkspaceCreationFormApi;
}) {
  return (
    <form.Field
      mode="array"
      name="workspace.access.members"
      validators={{
        onChange: ({ value }) => validateWorkspaceCreationMembers(value),
      }}
    >
      {(membersField) => {
        const membersError = getWorkspaceCreationFieldError(
          membersField.state.meta.errors
        );

        return (
          <FieldSet className={cn(className)}>
            <FieldLegend>Members</FieldLegend>
            <FieldDescription>
              Add up to five collaborators and choose what they can manage.
            </FieldDescription>
            <FieldError>{membersError}</FieldError>

            <FieldGroup>
              {membersField.state.value.map((member, index) => (
                <FieldGroup
                  className="gap-3 rounded-lg border p-3 sm:grid sm:grid-cols-[minmax(0,1fr)_8rem_auto] sm:items-start"
                  key={member.id}
                >
                  <form.Field
                    name={`workspace.access.members[${index}].email`}
                    validators={{
                      onChange: ({ value }) =>
                        validateWorkspaceCreationMemberEmail(value),
                    }}
                  >
                    {(field) => {
                      const errorMessage = getWorkspaceCreationFieldError(
                        field.state.meta.errors
                      );
                      const inputId = `workspace-creation-member-${member.id}-email`;
                      const errorId = `${inputId}-error`;

                      return (
                        <Field
                          data-invalid={
                            field.state.meta.isValid ? undefined : true
                          }
                        >
                          <FieldLabel htmlFor={inputId}>
                            Member {index + 1} email
                          </FieldLabel>
                          <Input
                            aria-describedby={
                              errorMessage ? errorId : undefined
                            }
                            aria-invalid={!field.state.meta.isValid}
                            autoComplete="off"
                            id={inputId}
                            inputMode="email"
                            maxLength={254}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(event.target.value)
                            }
                            required
                            type="email"
                            value={field.state.value}
                          />
                          <FieldError id={errorId}>{errorMessage}</FieldError>
                        </Field>
                      );
                    }}
                  </form.Field>

                  <form.Field name={`workspace.access.members[${index}].role`}>
                    {(field) => {
                      const inputId = `workspace-creation-member-${member.id}-role`;

                      return (
                        <Field>
                          <FieldLabel htmlFor={inputId}>Role</FieldLabel>
                          <NativeSelect
                            className="w-full"
                            id={inputId}
                            name={field.name}
                            onBlur={field.handleBlur}
                            onChange={(event) =>
                              field.handleChange(
                                event.target
                                  .value as WorkspaceCreationMemberRole
                              )
                            }
                            value={field.state.value}
                          >
                            <NativeSelectOption value="member">
                              Member
                            </NativeSelectOption>
                            <NativeSelectOption value="admin">
                              Admin
                            </NativeSelectOption>
                          </NativeSelect>
                        </Field>
                      );
                    }}
                  </form.Field>

                  <Field className="sm:w-auto sm:pt-6">
                    <Button
                      aria-label={`Remove member ${index + 1}`}
                      className="size-11 sm:size-8"
                      onClick={() => membersField.removeValue(index)}
                      size="icon"
                      title={`Remove member ${index + 1}`}
                      type="button"
                      variant="ghost"
                    >
                      <Trash2Icon />
                    </Button>
                  </Field>
                </FieldGroup>
              ))}

              <Button
                className="w-full"
                disabled={
                  membersField.state.value.length >=
                  MAX_WORKSPACE_CREATION_MEMBERS
                }
                onClick={() =>
                  membersField.pushValue({
                    id: crypto.randomUUID(),
                    email: "",
                    role: "member",
                  })
                }
                size="touch"
                type="button"
                variant="outline"
              >
                <PlusIcon data-icon="inline-start" />
                Add member
              </Button>
            </FieldGroup>
          </FieldSet>
        );
      }}
    </form.Field>
  );
}

/** Renders typed TanStack Form controls for creating one Workspace. */
export function CreateWorkspaceDialog({
  className,
  onOpenChange,
  open,
}: CreateWorkspaceDialogProps) {
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const form = useWorkspaceCreationForm({
    onCreated: () => onOpenChange(false),
    onSubmissionError: setSubmissionError,
  });

  function changeDialogOpenState(nextOpen: boolean) {
    if (!nextOpen) {
      form.reset();
      setSubmissionError(null);
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog onOpenChange={changeDialogOpenState} open={open}>
      <DialogContent
        className={cn(
          "max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Name your workspace and set initial member roles.
          </DialogDescription>
        </DialogHeader>

        <form
          aria-label="Create workspace"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            void form.handleSubmit();
          }}
        >
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Workspace details</FieldLegend>
              <form.Field
                name="workspace.identity.name"
                validators={{
                  onChange: ({ value }) => validateWorkspaceCreationName(value),
                }}
              >
                {(field) => {
                  const errorMessage = getWorkspaceCreationFieldError(
                    field.state.meta.errors
                  );
                  const descriptionId = "workspace-creation-name-description";
                  const errorId = "workspace-creation-name-error";

                  return (
                    <Field
                      data-invalid={field.state.meta.isValid ? undefined : true}
                    >
                      <FieldLabel htmlFor="workspace-creation-name">
                        Workspace name
                      </FieldLabel>
                      <Input
                        aria-describedby={`${descriptionId}${errorMessage ? ` ${errorId}` : ""}`}
                        aria-invalid={!field.state.meta.isValid}
                        autoComplete="organization"
                        id="workspace-creation-name"
                        maxLength={48}
                        name={field.name}
                        onBlur={field.handleBlur}
                        onChange={(event) =>
                          field.handleChange(event.target.value)
                        }
                        required
                        value={field.state.value}
                      />
                      <FieldDescription id={descriptionId}>
                        Shown in the workspace switcher.
                      </FieldDescription>
                      <FieldError id={errorId}>{errorMessage}</FieldError>
                    </Field>
                  );
                }}
              </form.Field>
            </FieldSet>

            <WorkspaceCreationMembersFieldset form={form} />
          </FieldGroup>

          {submissionError && (
            <Alert className="mt-5" variant="destructive">
              <CircleAlertIcon />
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="mt-5">
            <Button
              onClick={() => changeDialogOpenState(false)}
              size="touch"
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <form.Subscribe
              selector={(state) =>
                state.canSubmit &&
                !state.isPristine &&
                !state.isSubmitting &&
                !state.isValidating
              }
            >
              {(isSubmitReady) => (
                <Button disabled={!isSubmitReady} size="touch" type="submit">
                  <form.Subscribe selector={(state) => state.isSubmitting}>
                    {(isSubmitting) => (
                      <>
                        {isSubmitting && <Spinner data-icon="inline-start" />}
                        {isSubmitting ? "Creating…" : "Create workspace"}
                      </>
                    )}
                  </form.Subscribe>
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
