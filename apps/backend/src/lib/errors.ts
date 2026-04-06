export class DomainError extends Error {
  constructor(
    message: string,
    public code: string = 'DOMAIN_ERROR',
    public statusCode: number = 400,
  ) {
    super(message)
    this.name = 'DomainError'
  }
}

export class SignatureError extends DomainError {
  constructor(message = 'invalid signature') {
    super(message, 'SIGNATURE_INVALID', 401)
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'not found') {
    super(message, 'NOT_FOUND', 404)
  }
}
