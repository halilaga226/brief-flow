"use client"

import { createTaskAction } from "@/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ColleagueDTO } from "@/lib/dto"
import { roleLabel } from "@/lib/workflow"
import { useActionState, useState } from "react"

export function NewTaskForm({
  people,
  defaultDue,
  drive,
}: {
  people: ColleagueDTO[]
  defaultDue: string
  drive: { mode: "google" | "mock"; reason: string | null }
}) {
  const fallback = people.find((person) => person.role === "INTERN")?.id ?? people[0]?.id ?? ""
  const [assigneeId, setAssigneeId] = useState(fallback)
  const [state, action, pending] = useActionState(createTaskAction, null)
  const lawyers = people.filter((person) => person.role === "LAWYER")
  const interns = people.filter((person) => person.role === "INTERN")

  return (
    <form action={action} className="grid gap-4">
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="title">Başlık</Label>
        <Input id="title" name="title" required minLength={3} maxLength={160} className="h-10" placeholder="İşe iade dava dilekçesi" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="clientName">Müvekkil</Label>
          <Input id="clientName" name="clientName" required className="h-10" placeholder="Deniz Acar" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fileNumber">Dosya no</Label>
          <Input id="fileNumber" name="fileNumber" required className="h-10" placeholder="2026/184 Esas" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="dueDate">Son teslim</Label>
          <Input id="dueDate" name="dueDate" type="date" required defaultValue={defaultDue} className="h-10" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="assignee">Atanan</Label>
          <input type="hidden" name="assigneeId" value={assigneeId} />
          <Select value={assigneeId} onValueChange={setAssigneeId}>
            <SelectTrigger id="assignee" className="h-10 w-full">
              <SelectValue placeholder="Kişi seçin" />
            </SelectTrigger>
            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
              {lawyers.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>Avukatlar</SelectLabel>
                  {lawyers.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name} · {person.title || roleLabel(person.role)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
              {interns.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>Stajyerler</SelectLabel>
                  {interns.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name} · {person.title || roleLabel(person.role)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="description">Talimat / not</Label>
        <Textarea
          id="description"
          name="description"
          required
          minLength={8}
          rows={6}
          placeholder="Ne hazırlanacak, hangi belge esas alınacak, nelere dikkat edilecek?"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="file">Ek dosya (isteğe bağlı)</Label>
        <Input
          id="file"
          name="file"
          type="file"
          accept=".pdf,.doc,.docx,.odt,.jpg,.jpeg,.png,.tif,.tiff,.udf"
          className="h-11"
        />
        <p className="text-xs text-muted-foreground">
          {drive.mode === "google"
            ? "Ek, Google Drive klasörüne yüklenir. Sunucuda kopya tutulmaz."
            : drive.reason}
        </p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !assigneeId} className="bg-[#16324f]">
          {pending ? "Atanıyor…" : "Görevi ata"}
        </Button>
      </div>
    </form>
  )
}
