export class UpstreamBadGatewayError extends Error {
  constructor(message = 'Upstream service returned an invalid response') {
    super(message);
  }
}

export class UpstreamTimeoutError extends Error {
  constructor(message = 'Upstream service timed out') {
    super(message);
  }
}
