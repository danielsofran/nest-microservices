export class CreateProductDto {
  name: string
  description: string
  active: boolean
  price: number
  currency: string

  constructor(partial: Partial<CreateProductDto> = {}) {
    if (partial) {
      this.name = partial.name || ''
      this.description = partial.description || ''
      this.active = partial.active !== undefined ? partial.active : true
      this.price = partial.price || 0
      this.currency = partial.currency || 'USD'
    }
  }
}
