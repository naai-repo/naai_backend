const wrapperMessage = (status, message = "", data = "") => {
    let errObj = {status, message,data};
    return errObj;
}

module.exports = wrapperMessage;