export class CreateUserDto {
  firstName: string
  lastName: string
  email: string
  password: string
  googleId: string
  role: string

  constructor(partial: Partial<CreateUserDto> = {}) {
    if (partial) {
      this.firstName = partial.firstName || ""
      this.lastName = partial.lastName || ""
      this.email = partial.email || ""
      this.password = partial.password || ""
      this.googleId = partial.googleId || ""
      this.role = partial.role || "user"
    }
  }
}
