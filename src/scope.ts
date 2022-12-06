export class Scope {
  private values: Map<string, unknown> = new Map()
  constructor(public readonly parent?: Scope) {}

  getValue(identifier: string): unknown {
    if (this.values.has(identifier)) {
      return this.values.get(identifier)
    }

    return this.parent?.getValue(identifier)
  }

  setValue(identifier: string, value: unknown) {
    this.values.set(identifier, value)
  }
}
