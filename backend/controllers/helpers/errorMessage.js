const errorMessage = (status, error, path, message, info) => {
    return {
        timestamp: new Date(),
        status: status,
        error: error,
        path: path,
        message: message,
        info: info
    };
};

module.exports = errorMessage;