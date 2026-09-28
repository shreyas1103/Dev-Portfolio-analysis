const { z } = require("zod");

const reposQuerySchema = z.object({
  sort: z.enum(["quality", "recent"]).default("quality"),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = {
  reposQuerySchema,
};