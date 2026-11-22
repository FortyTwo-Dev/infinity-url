declare module '#app' {
  interface PageMeta {
    /** Reachable without a session. */
    public?: boolean
    /** Redirects an authenticated visitor to the links list. */
    guestOnly?: boolean
    /** Capability required by the route, read from `GET /me`. */
    capability?: string
  }
}

export {}
