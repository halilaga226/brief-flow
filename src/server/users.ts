import bcrypt from "bcryptjs"
import type { SessionUser } from "@/lib/dto"
import { prisma } from "@/lib/prisma"
import {
  assertLawyer,
  isDemoEmail,
  isDemoUsername,
  validateNewPassword,
  validatePersonEmail,
  validatePersonName,
  validatePersonRole,
  validatePersonTitle,
  validateUsername,
} from "@/lib/users"
import { WorkflowError, roleLabel } from "@/lib/workflow"

export type ManagedUser = {
  id: string
  name: string
  username: string
  email: string | null
  title: string
  role: "LAWYER" | "INTERN" | "ADMIN"
  roleLabel: string
  isDemo: boolean
  isSelf: boolean
  taskCount: number
  canDelete: boolean
}

export async function listManagedUsers(actor: SessionUser) {
  assertLawyer(actor.role)
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          assignedTasks: true,
          createdTasks: true,
          comments: true,
          logs: true,
          files: true,
        },
      },
    },
  })

  return users.map((user): ManagedUser => {
    const taskCount = user._count.assignedTasks + user._count.createdTasks
    const related =
      taskCount + user._count.comments + user._count.logs + user._count.files
    const isSelf = user.id === actor.id
    const isDemo = isDemoEmail(user.email) || isDemoUsername(user.username)
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      title: user.title,
      role: user.role,
      roleLabel: roleLabel(user.role),
      isDemo,
      isSelf,
      taskCount,
      canDelete: !isSelf && related === 0,
    }
  })
}

export async function createOfficeUser(
  actor: SessionUser,
  input: {
    name: string
    username: string
    email: string
    title: string
    role: string
    password: string
  },
) {
  assertLawyer(actor.role)
  const name = validatePersonName(input.name)
  if (!name.ok) throw new WorkflowError(name.error)
  const username = validateUsername(input.username)
  if (!username.ok) throw new WorkflowError(username.error)
  const email = validatePersonEmail(input.email)
  if (!email.ok) throw new WorkflowError(email.error)
  const title = validatePersonTitle(input.title)
  if (!title.ok) throw new WorkflowError(title.error)
  const role = validatePersonRole(input.role)
  if (!role.ok) throw new WorkflowError(role.error)
  const password = validateNewPassword(input.password)
  if (!password.ok) throw new WorkflowError(password.error)

  const existingUsername = await prisma.user.findUnique({
    where: { username: username.username },
  })
  if (existingUsername) throw new WorkflowError("Bu kullanıcı adı zaten alınmış.")
  if (email.email) {
    const existingEmail = await prisma.user.findUnique({ where: { email: email.email } })
    if (existingEmail) throw new WorkflowError("Bu e-posta zaten kayıtlı.")
  }

  const passwordHash = await bcrypt.hash(password.password, 12)
  const created = await prisma.user.create({
    data: {
      id: `user_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
      name: name.name,
      username: username.username,
      email: email.email,
      title: title.title,
      role: role.role,
      passwordHash,
    },
  })
  return { id: created.id, username: created.username, name: created.name }
}

export async function resetOfficePassword(
  actor: SessionUser,
  userId: string,
  rawPassword: string,
) {
  assertLawyer(actor.role)
  const password = validateNewPassword(rawPassword)
  if (!password.ok) throw new WorkflowError(password.error)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new WorkflowError("Kullanıcı bulunamadı.")
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(password.password, 12) },
  })
  return { username: user.username, name: user.name }
}

export async function changeOwnPassword(
  actor: SessionUser,
  currentPassword: string,
  nextPassword: string,
) {
  const user = await prisma.user.findUnique({ where: { id: actor.id } })
  if (!user) throw new WorkflowError("Oturum geçersiz.")
  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) throw new WorkflowError("Mevcut parola hatalı.")
  const password = validateNewPassword(nextPassword)
  if (!password.ok) throw new WorkflowError(password.error)
  if (currentPassword === password.password) {
    throw new WorkflowError("Yeni parola eskisiyle aynı olamaz.")
  }
  await prisma.user.update({
    where: { id: actor.id },
    data: { passwordHash: await bcrypt.hash(password.password, 12) },
  })
}

export async function deleteOfficeUser(actor: SessionUser, userId: string) {
  assertLawyer(actor.role)
  if (userId === actor.id) {
    throw new WorkflowError("Kendi hesabınızı silemezsiniz.")
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      _count: {
        select: {
          assignedTasks: true,
          createdTasks: true,
          comments: true,
          logs: true,
          files: true,
          notifications: true,
        },
      },
    },
  })
  if (!user) throw new WorkflowError("Kullanıcı bulunamadı.")
  const related =
    user._count.assignedTasks +
    user._count.createdTasks +
    user._count.comments +
    user._count.logs +
    user._count.files
  if (related > 0) {
    throw new WorkflowError(
      "Bu kişinin görevi veya işlem kaydı var. Önce işleri başka birine taşıyın veya hesabı bırakın.",
    )
  }
  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { userId } })
    await tx.user.delete({ where: { id: userId } })
  })
  return { name: user.name, username: user.username }
}
