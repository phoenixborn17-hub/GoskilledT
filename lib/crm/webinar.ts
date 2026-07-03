// Read-only webinar query (Ticket 6). Next active, upcoming webinar — or null.
import { prisma } from "../prisma";

export async function getNextWebinar() {
  return prisma.webinar.findFirst({
    where: { isActive: true, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
}
