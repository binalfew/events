import { prisma } from "~/lib/db.server";
import { logger } from "~/lib/logger.server";
import { FKRemapper } from "~/services/event-clone/fk-remapper.server";
import type {
  CloneOptions,
  CreateSeriesInput,
  UpdateSeriesInput,
  AddEditionInput,
  UpdateEditionInput,
} from "~/lib/schemas/event-clone";

// ─── Types ────────────────────────────────────────────────

export class EventCloneError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "EventCloneError";
  }
}

interface ServiceContext {
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
}

// ─── Series CRUD ──────────────────────────────────────────

export async function createSeries(input: CreateSeriesInput, ctx: ServiceContext) {
  const series = await prisma.eventSeries.create({
    data: {
      tenantId: ctx.tenantId,
      name: input.name,
      description: input.description,
    },
  });

  logger.info({ seriesId: series.id }, "Event series created");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "EventSeries",
      entityId: series.id,
      description: `Created event series "${input.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: input.name },
    },
  });

  return series;
}

export async function listSeries(tenantId: string) {
  return prisma.eventSeries.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { editions: true } },
    },
  });
}

export async function getSeries(id: string, tenantId: string) {
  const series = await prisma.eventSeries.findFirst({
    where: { id, tenantId },
    include: {
      editions: {
        orderBy: { editionNumber: "asc" },
        include: {
          event: { select: { id: true, name: true, status: true, startDate: true, endDate: true } },
        },
      },
    },
  });
  if (!series) {
    throw new EventCloneError("Event series not found", 404);
  }
  return series;
}

export async function updateSeries(id: string, input: UpdateSeriesInput, ctx: ServiceContext) {
  const existing = await prisma.eventSeries.findFirst({
    where: { id, tenantId: ctx.tenantId },
  });
  if (!existing) {
    throw new EventCloneError("Event series not found", 404);
  }

  const series = await prisma.eventSeries.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
    },
  });

  logger.info({ seriesId: id }, "Event series updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "EventSeries",
      entityId: id,
      description: `Updated event series "${series.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: JSON.parse(JSON.stringify(input)),
    },
  });

  return series;
}

export async function deleteSeries(id: string, ctx: ServiceContext) {
  const existing = await prisma.eventSeries.findFirst({
    where: { id, tenantId: ctx.tenantId },
    include: { _count: { select: { editions: true } } },
  });
  if (!existing) {
    throw new EventCloneError("Event series not found", 404);
  }
  if (existing._count.editions > 0) {
    throw new EventCloneError("Cannot delete series with existing editions", 400);
  }

  await prisma.eventSeries.delete({ where: { id } });

  logger.info({ seriesId: id }, "Event series deleted");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "EventSeries",
      entityId: id,
      description: `Deleted event series "${existing.name}"`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { name: existing.name },
    },
  });
}

// ─── Edition CRUD ─────────────────────────────────────────

export async function addEdition(input: AddEditionInput, ctx: ServiceContext) {
  const edition = await prisma.eventEdition.create({
    data: {
      seriesId: input.seriesId,
      eventId: input.eventId,
      editionNumber: input.editionNumber,
      year: input.year,
      hostCountry: input.hostCountry,
      hostCity: input.hostCity,
      notes: input.notes,
    },
  });

  logger.info({ editionId: edition.id }, "Event edition added");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CREATE",
      entityType: "EventEdition",
      entityId: edition.id,
      description: `Added edition #${input.editionNumber} to series`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { editionNumber: input.editionNumber, year: input.year },
    },
  });

  return edition;
}

export async function removeEdition(editionId: string, ctx: ServiceContext) {
  const existing = await prisma.eventEdition.findFirst({
    where: { id: editionId },
  });
  if (!existing) {
    throw new EventCloneError("Edition not found", 404);
  }

  await prisma.eventEdition.delete({ where: { id: editionId } });

  logger.info({ editionId }, "Event edition removed");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "DELETE",
      entityType: "EventEdition",
      entityId: editionId,
      description: `Removed edition #${existing.editionNumber} from series`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { editionNumber: existing.editionNumber },
    },
  });
}

export async function updateEdition(
  editionId: string,
  input: UpdateEditionInput,
  ctx: ServiceContext,
) {
  const existing = await prisma.eventEdition.findFirst({
    where: { id: editionId },
  });
  if (!existing) {
    throw new EventCloneError("Edition not found", 404);
  }

  const edition = await prisma.eventEdition.update({
    where: { id: editionId },
    data: {
      ...(input.editionNumber !== undefined && { editionNumber: input.editionNumber }),
      ...(input.year !== undefined && { year: input.year }),
      ...(input.hostCountry !== undefined && { hostCountry: input.hostCountry }),
      ...(input.hostCity !== undefined && { hostCity: input.hostCity }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
  });

  logger.info({ editionId }, "Event edition updated");

  await prisma.auditLog.create({
    data: {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: "CONFIGURE",
      entityType: "EventEdition",
      entityId: editionId,
      description: `Updated edition #${edition.editionNumber}`,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: JSON.parse(JSON.stringify(input)),
    },
  });

  return edition;
}

// ─── Clone Engine ─────────────────────────────────────────

export async function startCloneOperation(options: CloneOptions, ctx: ServiceContext) {
  return prisma.$transaction(
    async (tx) => {
      // 1. Create CloneOperation with PENDING status
      const cloneOp = await tx.cloneOperation.create({
        data: {
          tenantId: ctx.tenantId,
          sourceEventId: options.sourceEventId,
          status: "PENDING",
          options: JSON.parse(JSON.stringify(options)),
          createdBy: ctx.userId,
        },
      });

      // 2. Validate source event
      const sourceEvent = await tx.event.findFirst({
        where: { id: options.sourceEventId, tenantId: ctx.tenantId },
      });
      if (!sourceEvent) {
        await tx.cloneOperation.update({
          where: { id: cloneOp.id },
          data: { status: "FAILED", errorLog: "Source event not found" },
        });
        throw new EventCloneError("Source event not found", 404);
      }

      // 3. Create target event
      const targetEvent = await tx.event.create({
        data: {
          tenantId: ctx.tenantId,
          name: options.targetEventName,
          description: sourceEvent.description,
          status: "DRAFT",
          startDate: new Date(options.targetStartDate),
          endDate: new Date(options.targetEndDate),
          extras: sourceEvent.extras ?? {},
        },
      });

      // 4. Transition to IN_PROGRESS
      await tx.cloneOperation.update({
        where: { id: cloneOp.id },
        data: { status: "IN_PROGRESS", targetEventId: targetEvent.id },
      });

      // 5. Initialize FKRemapper
      const remapper = new FKRemapper();
      remapper.register(sourceEvent.id, targetEvent.id);

      const elementsCopied: Record<string, number> = {};

      try {
        // 6. Clone elements in dependency order

        // ── ParticipantTypes (first — others reference them) ──
        if (options.elements.participantTypes) {
          const sourceTypes = await tx.participantType.findMany({
            where: { eventId: sourceEvent.id, tenantId: ctx.tenantId },
          });
          for (const pt of sourceTypes) {
            const newPt = await tx.participantType.create({
              data: {
                tenantId: ctx.tenantId,
                eventId: targetEvent.id,
                name: pt.name,
                code: pt.code,
                description: pt.description,
              },
            });
            remapper.register(pt.id, newPt.id);
          }
          elementsCopied.participantTypes = sourceTypes.length;
        }

        // ── FieldDefinitions ──
        // Only clone event-scoped fields; global fields (eventId=null) are shared
        // automatically and excluded by this query.
        if (options.elements.fieldDefinitions) {
          const sourceFields = await tx.fieldDefinition.findMany({
            where: { eventId: sourceEvent.id, tenantId: ctx.tenantId },
          });
          for (const fd of sourceFields) {
            const newFd = await tx.fieldDefinition.create({
              data: {
                tenantId: ctx.tenantId,
                eventId: targetEvent.id,
                entityType: fd.entityType,
                name: fd.name,
                label: fd.label,
                description: fd.description,
                dataType: fd.dataType,
                sortOrder: fd.sortOrder,
                isRequired: fd.isRequired,
                isUnique: fd.isUnique,
                isSearchable: fd.isSearchable,
                isFilterable: fd.isFilterable,
                defaultValue: fd.defaultValue,
                config: remapper.remapJson(fd.config) as any,
                validation: remapper.remapJson(fd.validation) as any,
              },
            });
            remapper.register(fd.id, newFd.id);
          }
          elementsCopied.fieldDefinitions = sourceFields.length;
        }

        // ── Workflows (two-pass for step references) ──
        if (options.elements.workflows) {
          const sourceWorkflows = await tx.workflow.findMany({
            where: { eventId: sourceEvent.id, tenantId: ctx.tenantId, deletedAt: null },
          });

          let totalSteps = 0;
          let totalAssignments = 0;
          let totalAutoRules = 0;

          for (const wf of sourceWorkflows) {
            // Create workflow (always DRAFT)
            const newWf = await tx.workflow.create({
              data: {
                tenantId: ctx.tenantId,
                eventId: targetEvent.id,
                name: wf.name,
                description: wf.description,
                status: "DRAFT",
              },
            });
            remapper.register(wf.id, newWf.id);

            // Pass 1: Create steps with null FK refs
            const sourceSteps = await tx.step.findMany({
              where: { workflowId: wf.id },
              orderBy: { order: "asc" },
            });

            for (const step of sourceSteps) {
              const newStep = await tx.step.create({
                data: {
                  workflowId: newWf.id,
                  name: step.name,
                  description: step.description,
                  order: step.order,
                  stepType: step.stepType,
                  isEntryPoint: step.isEntryPoint,
                  isTerminal: step.isTerminal,
                  nextStepId: null,
                  rejectionTargetId: null,
                  bypassTargetId: null,
                  escalationTargetId: null,
                  slaDurationMinutes: step.slaDurationMinutes,
                  slaAction: step.slaAction,
                  config: remapper.remapJson(step.config) as any,
                },
              });
              remapper.register(step.id, newStep.id);
            }
            totalSteps += sourceSteps.length;

            // Pass 2: Update step references with remapped IDs
            for (const step of sourceSteps) {
              const newStepId = remapper.remap(step.id);
              if (!newStepId) continue;

              const updateData: Record<string, string | null> = {};
              if (step.nextStepId) {
                updateData.nextStepId = remapper.remap(step.nextStepId);
              }
              if (step.rejectionTargetId) {
                updateData.rejectionTargetId = remapper.remap(step.rejectionTargetId);
              }
              if (step.bypassTargetId) {
                updateData.bypassTargetId = remapper.remap(step.bypassTargetId);
              }
              if (step.escalationTargetId) {
                updateData.escalationTargetId = remapper.remap(step.escalationTargetId);
              }

              if (Object.keys(updateData).length > 0) {
                await tx.step.update({
                  where: { id: newStepId },
                  data: updateData,
                });
              }
            }

            // Clone StepAssignments
            for (const step of sourceSteps) {
              const assignments = await tx.stepAssignment.findMany({
                where: { stepId: step.id },
              });
              for (const sa of assignments) {
                const newStepId = remapper.remap(step.id);
                if (!newStepId) continue;
                await tx.stepAssignment.create({
                  data: {
                    stepId: newStepId,
                    userId: sa.userId,
                    strategy: sa.strategy,
                    isActive: sa.isActive,
                    assignedBy: sa.assignedBy,
                  },
                });
                totalAssignments++;
              }
            }

            // Clone AutoActionRules
            for (const step of sourceSteps) {
              const rules = await tx.autoActionRule.findMany({
                where: { stepId: step.id },
              });
              for (const rule of rules) {
                const newStepId = remapper.remap(step.id);
                if (!newStepId) continue;
                await tx.autoActionRule.create({
                  data: {
                    stepId: newStepId,
                    name: rule.name,
                    description: rule.description,
                    conditionExpression: remapper.remapJson(rule.conditionExpression) as any,
                    actionType: rule.actionType,
                    priority: rule.priority,
                    isActive: rule.isActive,
                    createdBy: rule.createdBy,
                  },
                });
                totalAutoRules++;
              }
            }
          }

          elementsCopied.workflows = sourceWorkflows.length;
          elementsCopied.steps = totalSteps;
          elementsCopied.stepAssignments = totalAssignments;
          elementsCopied.autoActionRules = totalAutoRules;
        }

        // ── FormTemplates ──
        if (options.elements.forms) {
          const sourceForms = await tx.formTemplate.findMany({
            where: { eventId: sourceEvent.id, tenantId: ctx.tenantId },
          });
          for (const ft of sourceForms) {
            const newFt = await tx.formTemplate.create({
              data: {
                tenantId: ctx.tenantId,
                eventId: targetEvent.id,
                participantTypeId: remapper.remap(ft.participantTypeId),
                name: ft.name,
                description: ft.description,
                version: 1,
                definition: remapper.remapJson(ft.definition) as any,
                isActive: ft.isActive,
              },
            });
            remapper.register(ft.id, newFt.id);
          }
          elementsCopied.formTemplates = sourceForms.length;
        }

        // ── DelegationQuotas (reset usedCount to 0) ──
        if (options.elements.delegations) {
          const sourceQuotas = await tx.delegationQuota.findMany({
            where: { eventId: sourceEvent.id, tenantId: ctx.tenantId },
          });
          for (const dq of sourceQuotas) {
            const newDq = await tx.delegationQuota.create({
              data: {
                tenantId: ctx.tenantId,
                eventId: targetEvent.id,
                organizationId: dq.organizationId,
                maxParticipants: dq.maxParticipants,
                usedCount: 0,
              },
            });
            remapper.register(dq.id, newDq.id);
          }
          elementsCopied.delegationQuotas = sourceQuotas.length;
        }

        // ── Checkpoints ──
        if (options.elements.checkpoints) {
          const sourceCheckpoints = await tx.checkpoint.findMany({
            where: { eventId: sourceEvent.id, tenantId: ctx.tenantId },
          });
          for (const cp of sourceCheckpoints) {
            const newCp = await tx.checkpoint.create({
              data: {
                tenantId: ctx.tenantId,
                eventId: targetEvent.id,
                name: cp.name,
                location: cp.location,
                type: cp.type,
                direction: cp.direction,
                isActive: cp.isActive,
                capacity: cp.capacity,
              },
            });
            remapper.register(cp.id, newCp.id);
          }
          elementsCopied.checkpoints = sourceCheckpoints.length;
        }

        // 7. Record elementsCopied
        // 8. If seriesId provided, create EventEdition
        if (options.seriesId && options.editionNumber) {
          await tx.eventEdition.create({
            data: {
              seriesId: options.seriesId,
              eventId: targetEvent.id,
              editionNumber: options.editionNumber,
              year: new Date(options.targetStartDate).getFullYear(),
            },
          });
        }

        // 9. Set status to COMPLETED
        const completed = await tx.cloneOperation.update({
          where: { id: cloneOp.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            elementsCopied,
          },
        });

        // 11. Create audit log
        await tx.auditLog.create({
          data: {
            tenantId: ctx.tenantId,
            userId: ctx.userId,
            action: "CREATE",
            entityType: "CloneOperation",
            entityId: cloneOp.id,
            description: `Cloned event "${sourceEvent.name}" → "${options.targetEventName}"`,
            ipAddress: ctx.ipAddress,
            userAgent: ctx.userAgent,
            metadata: {
              sourceEventId: sourceEvent.id,
              targetEventId: targetEvent.id,
              elementsCopied,
              totalMappings: remapper.stats.totalMappings,
            },
          },
        });

        logger.info(
          {
            cloneOpId: cloneOp.id,
            sourceEventId: sourceEvent.id,
            targetEventId: targetEvent.id,
            elementsCopied,
          },
          "Event clone completed",
        );

        return { ...completed, targetEventId: targetEvent.id, elementsCopied };
      } catch (error) {
        // 10. On error: set status to FAILED
        await tx.cloneOperation.update({
          where: { id: cloneOp.id },
          data: {
            status: "FAILED",
            errorLog: error instanceof Error ? error.message : String(error),
          },
        });
        throw error;
      }
    },
    { timeout: 60_000 },
  );
}

// ─── Clone Operation Queries ──────────────────────────────

export async function getCloneOperation(id: string, tenantId: string) {
  const op = await prisma.cloneOperation.findFirst({
    where: { id, tenantId },
  });
  if (!op) {
    throw new EventCloneError("Clone operation not found", 404);
  }
  return op;
}

export async function listCloneOperations(tenantId: string) {
  return prisma.cloneOperation.findMany({
    where: { tenantId },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
}
