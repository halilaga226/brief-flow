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
import type { ClientPickerDTO } from "@/server/clients"
import { useActionState, useMemo, useState } from "react"

export type TaskPrefill = {
  workItemId?: string
  title?: string
  clientName?: string
  clientId?: string
  fileNumber?: string
  caseFileId?: string
  description?: string
}

export function NewTaskForm({
  people,
  defaultDue,
  drive,
  prefill,
  clients = [],
}: {
  people: ColleagueDTO[]
  defaultDue: string
  drive: { mode: "google" | "mock"; reason: string | null }
  prefill?: TaskPrefill
  clients?: ClientPickerDTO[]
}) {
  const fallback = people.find((person) => person.role === "INTERN")?.id ?? people[0]?.id ?? ""
  const [assigneeId, setAssigneeId] = useState(fallback)
  const [clientId, setClientId] = useState(prefill?.clientId ?? "")
  const [caseFileId, setCaseFileId] = useState(prefill?.caseFileId ?? "")
  const [state, action, pending] = useActionState(createTaskAction, null)
  const lawyers = people.filter((person) => person.role === "LAWYER")
  const interns = people.filter((person) => person.role === "INTERN")
  const admins = people.filter((person) => person.role === "ADMIN")

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === clientId) ?? null,
    [clients, clientId],
  )
  const selectedFile = useMemo(
    () => selectedClient?.caseFiles.find((f) => f.id === caseFileId) ?? null,
    [selectedClient, caseFileId],
  )

  const usePicker = clients.length > 0
  const clientNameValue = usePicker
    ? (selectedClient?.name ?? prefill?.clientName ?? "")
    : (prefill?.clientName ?? "")
  const fileNumberValue = usePicker
    ? (selectedFile?.fileNumber || prefill?.fileNumber || "")
    : (prefill?.fileNumber ?? "")

  return (
    <form action={action} className="grid gap-4">
      {prefill?.workItemId ? (
        <input type="hidden" name="workItemId" value={prefill.workItemId} />
      ) : null}
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="title">Başlık</Label>
        <Input
          id="title"
          name="title"
          required
          minLength={3}
          maxLength={160}
          className="h-10"
          defaultValue={prefill?.title ?? ""}
          placeholder="İşe iade dava dilekçesi"
        />
      </div>
      {usePicker ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="clientId">Müvekkil</Label>
            <select
              id="clientId"
              name="clientId"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                setCaseFileId("")
              }}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              required
            >
              <option value="">Müvekkil seçin…</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
            <input type="hidden" name="clientName" value={clientNameValue} />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="caseFileId">Dosya (varsa)</Label>
            <select
              id="caseFileId"
              name="caseFileId"
              value={caseFileId}
              onChange={(e) => setCaseFileId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              disabled={!selectedClient}
            >
              <option value="">Dosya seçilmedi — aşağıya yazın</option>
              {(selectedClient?.caseFiles ?? []).map((file) => (
                <option key={file.id} value={file.id}>
                  {file.fileNumber}
                  {file.courtName ? ` · ${file.courtName}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="fileNumber">Dosya no</Label>
            <Input
              id="fileNumber"
              name="fileNumber"
              required
              className="h-10"
              key={`fn-${caseFileId || clientId || "x"}`}
              defaultValue={fileNumberValue}
              placeholder="2026/184 Esas"
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="clientName">Müvekkil</Label>
            <Input
              id="clientName"
              name="clientName"
              required
              className="h-10"
              defaultValue={prefill?.clientName ?? ""}
              placeholder="Deniz Acar"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="fileNumber">Dosya no</Label>
            <Input
              id="fileNumber"
              name="fileNumber"
              required
              className="h-10"
              defaultValue={prefill?.fileNumber ?? ""}
              placeholder="2026/184 Esas"
            />
          </div>
        </div>
      )}
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
              {admins.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>Yöneticiler</SelectLabel>
                  {admins.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name} · {person.title || roleLabel(person.role)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
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
          defaultValue={prefill?.description ?? ""}
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
        <Button type="submit" disabled={pending || !assigneeId} className="bg-primary font-semibold">
          {pending ? "Atanıyor…" : "Görevi ata"}
        </Button>
      </div>
    </form>
  )
}
