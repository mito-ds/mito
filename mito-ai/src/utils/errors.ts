export class ServerError extends Error {
    constructor(message: string = 'Server Error: The documentation service is currently unavailable. Please try again later.') {
        super(message);
        this.name = 'ServerError';
    }
}

export class TimeoutError extends Error {
    constructor(message: string = 'Request timed out. The server took too long to respond. Please try again.') {
        super(message);
        this.name = 'TimeoutError';
    }
}

export class ConnectionError extends Error {
    constructor(message: string = 'Connection Error: Unable to reach the documentation service. Please check your internet connection.') {
        super(message);
        this.name = 'ConnectionError';
    }
}

export class UnknownError extends Error {
    constructor(message: string = 'An unexpected error occurred. Please try again.') {
        super(message);
        this.name = 'UnknownError';
    }
}

export class OpenAIError extends Error {
    constructor(message: string = 'OpenAI API Error: An error occurred while communicating with the OpenAI service. Please try again later.') {
        super(message);
        this.name = 'OpenAIError';
    }
}
