-- DropForeignKey
ALTER TABLE "Participant" DROP CONSTRAINT "Participant_workflowId_fkey";

-- AlterTable
ALTER TABLE "Participant" ALTER COLUMN "workflowId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE SET NULL ON UPDATE CASCADE;
