const isLoggedIn = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        res.status(401).json({data: "Here"});
    }
}

module.exports = {isLoggedIn};