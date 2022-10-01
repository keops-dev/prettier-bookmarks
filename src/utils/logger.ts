class Logger {
    private environment: string | undefined;

    constructor() {
        this.environment = process.env.NODE_ENV;
    }

    log(message: string) {
        console.log(message);
    }

    debug(
        message: string,
        ...rest: (string | { title: string } | undefined)[]
    ) {
        if (this.environment === "development") {
            console.log(message, ...rest);
        }
    }

    error(message: string) {
        console.error(message);
    }
}

const logger = new Logger();

export default logger;
