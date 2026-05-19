const errorMessage = require("./errorMessage");
const { logError } = require("./errorLogger");

const sendControllerError = (req, res, err) => {
    const error = err instanceof Error ? err : new Error(String(err));
    logError("Controller error:", error);

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

const failSafe = handler => {
    return (req, res, next) => {
        try {
            const result = handler(req, res, next);

            if (result && typeof result.then == "function") {
                result.catch(err => sendControllerError(req, res, err));
            }
        }
        catch (err) {
            sendControllerError(req, res, err);
        }
    };
};

const wrapExports = controllerExports => {
    Object.keys(controllerExports).forEach(key => {
        if (typeof controllerExports[key] == "function" && !controllerExports[key].failSafeWrapped) {
            const wrapped = failSafe(controllerExports[key]);
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
