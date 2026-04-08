export interface InputLink {
  id: string
  source: string
  url: string
  metadata?: Record<string, any>
  createdAt?: number
  updatedAt?: number
}

export interface InputLinkResult {
  success: boolean
  link?: InputLink
  error?: string
}

export class InputLinkHandler {
  private links = new Map<string, InputLink>()

  register(link: InputLink): InputLinkResult {
    if (this.links.has(link.id)) {
      return { success: false, error: `Link with id "${link.id}" already exists.` }
    }
    const now = Date.now()
    this.links.set(link.id, { ...link, createdAt: now, updatedAt: now })
    return { success: true, link: this.links.get(link.id) }
  }

  get(id: string): InputLinkResult {
    const link = this.links.get(id)
    if (!link) {
      return { success: false, error: `No link found for id "${id}".` }
    }
    return { success: true, link }
  }

  list(): InputLink[] {
    return Array.from(this.links.values())
  }

  unregister(id: string): boolean {
    return this.links.delete(id)
  }

  /**
   * Update metadata or URL for an existing link
   */
  update(id: string, updates: Partial<Omit<InputLink, "id" | "source">>): InputLinkResult {
    const existing = this.links.get(id)
    if (!existing) {
      return { success: false, error: `No link found for id "${id}".` }
    }
    const updated: InputLink = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    }
    this.links.set(id, updated)
    return { success: true, link: updated }
  }

  /**
   * Clear all links
   */
  clear(): void {
    this.links.clear()
  }

  /**
   * Find links by source
   */
  findBySource(source: string): InputLink[] {
    return this.list().filter(l => l.source === source)
  }

  /**
   * Export all links as JSON
   */
  toJSON(): string {
    return JSON.stringify(this.list())
  }

  /**
   * Import links from JSON (replaces existing)
   */
  fromJSON(json: string): void {
    try {
      const arr = JSON.parse(json) as InputLink[]
      this.clear()
      for (const l of arr) {
        this.register(l)
      }
    } catch {
      throw new Error("Invalid JSON for InputLink import")
    }
  }
}
