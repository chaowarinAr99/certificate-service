export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class CertificateApiError extends Error {
  constructor(message = 'Certificate API request failed') {
    super(message);
  }
}

export class CertificateApiTimeoutError extends Error {
  constructor(message = 'Certificate API request timed out') {
    super(message);
  }
}

export class InvalidCertificateResponseError extends Error {
  constructor(message: string) {
    super(message);
  }
}
