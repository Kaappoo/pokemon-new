import { Schema } from 'effect'

export class NotFound extends Schema.TaggedError<NotFound>()('NotFound', {
  entity: Schema.String,
  id: Schema.String,
}) {
  // fallow-ignore-next-line unused-class-member
  override get message() {
    return `${this.entity} not found`
  }
}

export class Unauthenticated extends Schema.TaggedError<Unauthenticated>()('Unauthenticated', {}) {
  // fallow-ignore-next-line unused-class-member
  override get message() {
    return 'Sign in to continue'
  }
}

/** The request is valid but conflicts with the current state (e.g. a username already taken). */
export class InvalidState extends Schema.TaggedError<InvalidState>()('InvalidState', {
  reason: Schema.String,
}) {
  // fallow-ignore-next-line unused-class-member
  override get message() {
    return this.reason
  }
}

export class DatabaseError extends Schema.TaggedError<DatabaseError>()('DatabaseError', {
  cause: Schema.Defect(),
}) {
  // fallow-ignore-next-line unused-class-member
  override get message() {
    return 'Database request failed'
  }
}

/** TCGdex (the upstream card database) was unreachable or answered with something unexpected. */
export class UpstreamError extends Schema.TaggedError<UpstreamError>()('UpstreamError', {
  url: Schema.String,
  status: Schema.optional(Schema.Number),
  cause: Schema.optional(Schema.Defect()),
}) {
  // fallow-ignore-next-line unused-class-member
  override get message() {
    return this.status ? `TCGdex answered ${this.status} for ${this.url}` : `Could not reach TCGdex (${this.url})`
  }
}

export type AppError = NotFound | Unauthenticated | InvalidState | DatabaseError | UpstreamError

export const httpStatusFor = (error: AppError): number => {
  switch (error._tag) {
    case 'NotFound':
      return 404
    case 'Unauthenticated':
      return 401
    case 'InvalidState':
      return 409
    case 'DatabaseError':
      return 500
    case 'UpstreamError':
      return 502
  }
}
