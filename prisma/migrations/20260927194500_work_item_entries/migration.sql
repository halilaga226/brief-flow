-- CreateTable
CREATE TABLE "WorkItemEntry" (
    "id" TEXT NOT NULL,
    "workItemId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkItemEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkItemEntry_workItemId_idx" ON "WorkItemEntry"("workItemId");

-- AddForeignKey
ALTER TABLE "WorkItemEntry" ADD CONSTRAINT "WorkItemEntry_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkItemEntry" ADD CONSTRAINT "WorkItemEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
