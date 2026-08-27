import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ProjectDetailsFieldsProps = {
  className?: string
  description: string
  idPrefix: string
  name: string
  onDescriptionChange: (description: string) => void
  onNameChange: (name: string) => void
}

/** Renders shared project name and optional description controls. */
export function ProjectDetailsFields({
  className,
  description,
  idPrefix,
  name,
  onDescriptionChange,
  onNameChange,
}: ProjectDetailsFieldsProps) {
  return (
    <FieldGroup className={cn("gap-4", className)}>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-name`}>Name</FieldLabel>
        <Input
          autoComplete="off"
          className="h-11 sm:h-8"
          id={`${idPrefix}-name`}
          name="name"
          onChange={(event) => onNameChange(event.currentTarget.value)}
          placeholder="Pricing revamp"
          required
          spellCheck={false}
          type="text"
          value={name}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-description`}>
          Description{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </FieldLabel>
        <Textarea
          className="min-h-20"
          id={`${idPrefix}-description`}
          name="description"
          onChange={(event) => onDescriptionChange(event.currentTarget.value)}
          placeholder="What this project covers"
          value={description}
        />
      </Field>
    </FieldGroup>
  )
}
