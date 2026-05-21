const errorMessage = require("./errorMessage");
const { logError } = require("./errorLogger");

const controllerTimeoutMs = Number(process.env.CONTROLLER_TIMEOUT_MS) || 30000;

const getRequestLabel = (req) => {
    if (!req) {
        return "unknown request";
    }

    const method = req.method || "UNKNOWN";
    const url = req.originalUrl || req.url || req.path || "";
    return `${method} ${url}`.trim();
};

const sendControllerError = (req, res, err, handlerName) => {
    const error = err instanceof Error ? err : new Error(String(err));
    const controllerLabel = handlerName ? ` in ${handlerName}` : "";
    logError(`Controller error${controllerLabel} for ${getRequestLabel(req)}:`, error);

    if (res.headersSent) {
        return;
    }

    res.status(500).send(errorMessage(
        500,
        "Server Error",
        req && req.path ? req.path : "",
        error.message,
        ""
    ));
};

const failSafe = (handler, handlerName) => {
    return (req, res, next) => {
        let completed = false;
        const finishRequest = () => {
            completed = true;
            clearTimeout(timeout);
        };

        const timeout = setTimeout(() => {
            if (completed || res.headersSent) {
                return;
            }

            const error = new Error(`Controller timed out after ${controllerTimeoutMs}ms`);
            sendControllerError(req, res, error, handlerName);
        }, controllerTimeoutMs);

        res.once("finish", finishRequest);
        res.once("close", finishRequest);

        try {
            const result = handler(req, res, next);

            if (result && typeof result.then == "function") {
                return result.catch(err => sendControllerError(req, res, err, handlerName));
            }

            return result;
        }
        catch (err) {
            return sendControllerError(req, res, err, handlerName);
        }
    };
};

const wrapExports = controllerExports => {
    Object.keys(controllerExports).forEach(key => {
        if (typeof controllerExports[key] == "function" && !controllerExports[key].failSafeWrapped) {
            const wrapped = failSafe(controllerExports[key], key);
            wrapped.failSafeWrapped = true;
            controllerExports[key] = wrapped;
        }
    });
};

module.exports = {
    failSafe: failSafe,
    sendControllerError: sendControllerError,
    wrapExports: wrapExports
};
