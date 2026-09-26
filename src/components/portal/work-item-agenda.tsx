"use client"

import { createWorkItemAction, deleteWorkItemAction } from "@/actions/work-items"
import { useActionResult } from "@/components/portal/use-action-result"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { WorkItemDTO } from "@/server/work-items"
import { Plus, Trash2, UserPlus } from "lucide-react"
import Link from "next/link"
import { useActionState } from "react"

function CreateWorkItemForm() {
  const [state, action, pending] = useActionState(createWorkItemAction, null)
  useActionResult(state)

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Yeni iş</h2>
          <p className="text-sm text-muted-foreground">Ajandaya ekleyin, satırdan görev atayın.</p>
        </div>
        <Button type="submit" disabled={pending} className="font-semibold">
          <Plus />
          {pending ? "Ekleniyor…" : "Listeye ekle"}
        </Button>
      </div>
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="clientName">Müvekkil adı</Label>
          <Input id="clientName" name="clientName" required className="h-10" placeholder="Deniz Acar" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="opposingParty">Karşı taraf</Label>
          <Input id="opposingParty" name="opposingParty" required className="h-10" placeholder="XYZ A.Ş." />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="courtName">Mahkeme adı</Label>
          <Input id="courtName" name="courtName" required className="h-10" placeholder="İstanbul 5. İş Mahkemesi" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fileNumber">Dosya numarası</Label>
          <Input id="fileNumber" name="fileNumber" required className="h-10" placeholder="2026/184 Esas" />
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="workToDo">Yapılacak iş</Label>
          <Input id="workToDo" name="workToDo" required className="h-10" placeholder="İşe iade dilekçesi" />
        </div>
        <div className="grid gap-1.5 sm:col-span-2 xl:col-span-3">
          <Label htmlFor="notes">Notlar</Label>
          <Textarea id="notes" name="notes" rows={2} placeholder="Süre, belgeler, ek not…" />
        </div>
      </div>
    </form>
  )
}

function DeleteButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteWorkItemAction, null)
  useActionResult(state)
  return (
    <form action={action}>
      <input type="hidden" name="workItemId" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label="Sil"
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </form>
  )
}

export function WorkItemAgenda({ items }: { items: WorkItemDTO[] }) {
  return (
    <div className="grid gap-5">
      <CreateWorkItemForm />

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Ajanda</h2>
            <p className="text-sm text-muted-foreground">{items.length} kayıt</p>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="px-4 py-14 text-center text-sm text-muted-foreground">
            Henüz kayıt yok. Yukarıdan müvekkil işi ekleyin.
          </p>
        ) : (
          <>
            <div className="hidden overflow-x-auto xl:block">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Müvekkil</th>
                    <th className="px-4 py-3 font-semibold">Karşı taraf</th>
                    <th className="px-4 py-3 font-semibold">Mahkeme</th>
                    <th className="px-4 py-3 font-semibold">Dosya no</th>
                    <th className="px-4 py-3 font-semibold">Yapılacak iş</th>
                    <th className="px-4 py-3 font-semibold">Notlar</th>
                    <th className="px-4 py-3 text-right font-semibold">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="align-top transition hover:bg-muted/40">
                      <td className="px-4 py-3.5 font-semibold text-foreground">{item.clientName}</td>
                      <td className="px-4 py-3.5 text-foreground/90">{item.opposingParty}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{item.courtName}</td>
                      <td className="px-4 py-3.5 font-mono text-xs text-foreground">{item.fileNumber}</td>
                      <td className="max-w-[14rem] px-4 py-3.5 font-medium text-foreground">
                        {item.workToDo}
                        {item.taskCount > 0 ? (
                          <span className="mt-1 block text-xs font-semibold text-primary">
                            {item.taskCount} görev
                          </span>
                        ) : null}
                      </td>
                      <td className="max-w-[12rem] px-4 py-3.5 text-muted-foreground">
                        {item.notes || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button asChild size="sm" className="font-semibold">
                            <Link href={`/is-listesi/${item.id}/gorev`}>
                              <UserPlus />
                              İş ata
                            </Link>
                          </Button>
                          <DeleteButton id={item.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-border xl:hidden">
              {items.map((item) => (
                <li key={item.id} className="grid gap-3 px-4 py-4">
                  <div className="grid gap-1.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <p className="font-semibold text-foreground">{item.clientName}</p>
                      <span className="text-muted-foreground">×</span>
                      <p className="text-sm text-foreground/85">{item.opposingParty}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.courtName}</p>
                    <p className="font-mono text-xs text-foreground">{item.fileNumber}</p>
                    <p className="text-sm font-medium text-foreground">{item.workToDo}</p>
                    {item.notes ? <p className="text-sm text-muted-foreground">{item.notes}</p> : null}
                    {item.taskCount > 0 ? (
                      <span className="w-fit rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                        {item.taskCount} görev
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild className="flex-1 font-semibold sm:flex-none">
                      <Link href={`/is-listesi/${item.id}/gorev`}>
                        <UserPlus />
                        İş ata
                      </Link>
                    </Button>
                    <DeleteButton id={item.id} />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
