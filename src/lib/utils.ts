import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Create a standardized API error response with logging.
 * Usage: return apiError(request, 'Message', 400, error)
 */
export function apiError(
  message: string,
  status: number = 500,
  error?: unknown,
): Response {
  if (error && status >= 500) {
    console.error(`[API Error] ${message}:`, error)
  }
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}
