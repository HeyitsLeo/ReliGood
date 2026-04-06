import { z } from 'zod'
import { router, publicProcedure } from '../context.js'
import { loadAllConfig, updateConfig } from '../../domain/config.js'

export const configRouter = router({
  list: publicProcedure.query(async () => loadAllConfig()),
  update: publicProcedure
    .input(z.object({ key: z.string(), value: z.unknown() }))
    .mutation(async ({ input }) => {
      await updateConfig(input.key, input.value)
      return { ok: true }
    }),
})
