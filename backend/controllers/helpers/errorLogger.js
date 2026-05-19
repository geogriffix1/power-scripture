const fs = require("fs");
const path = require("path");
const util = require("util");

const logDirectory = path.join(__dirname, "..", "..", "logs");
const originalConsoleError = console.error.bind(console);
let installed = false;

const pad = value => String(value).padStart(2, "0");

const getLogDate = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

const getTimestamp = () => new Date().toISOString();

const getLogFilePath = () => path.join(logDirectory, `errors-${getLogDate()}.log`);

const formatArg = arg => {
    if (arg instanceof Error) {
        return arg.stack || arg.message;
    }

    if (typeof arg == "string") {
        return arg;
    }

    return util.inspect(arg, { depth: null, colors: false });
};

const writeErrorLog = args => {
    try {
        fs.mkdirSync(logDirectory, { recursive: true });
        const message = args.map(formatArg).join(" ");
        fs.appendFileSync(getLogFilePath(), `[${getTimestamp()}] ${message}\n`, "utf8");
    }
    catch (err) {
        originalConsoleError("Failed to write error log:", err);
    }
};

const logError = (...args) => {
    writeErrorLog(args);
    originalConsoleError(...args);
};

const installConsoleErrorLogger = () => {
    if (installed) {
        return;
    }

    console.error = (...args) => logError(...args);
    installed = true;
};

module.exports = {
    getLogFilePath: getLogFilePath,
    installConsoleErrorLogger: installConsoleErrorLogger,
    logError: logError
};
