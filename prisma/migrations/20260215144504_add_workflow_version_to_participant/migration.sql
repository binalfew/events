-- DropIndex
DROP INDEX "idx_event_active";

-- DropIndex
DROP INDEX "idx_participant_active";

-- DropIndex
DROP INDEX "idx_user_active";

-- DropIndex
DROP INDEX "idx_workflow_active";

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "workflowVersionId" TEXT;

-- CreateIndex
CREATE INDEX "Participant_workflowVersionId_idx" ON "Participant"("workflowVersionId");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_workflowVersionId_fkey" FOREIGN KEY ("workflowVersionId") REFERENCES "WorkflowVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
