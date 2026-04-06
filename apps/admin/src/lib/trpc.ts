'use client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@zamgo/backend/src/trpc/root.js'

export const trpc = createTRPCReact<AppRouter>()
