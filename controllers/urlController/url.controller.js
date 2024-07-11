const wrapperMessage = require("../../helper/wrapperMessage");
const Urls = require("../../model/urlShortner/Url.model");
const nanoId = require("nanoid");

exports.ShortenUrl = async (req, res, next) => {
  try {
    const uniqueCode = nanoId.nanoid(8);
    const { url } = req.body;
    if (!url) {
      let err = new Error("URL is required");
      err.status = 400;
      throw err;
    }
    const newUrl = new Urls({
      key: uniqueCode,
      url,
    });
    await newUrl.save();
    res.json(wrapperMessage("success", "URL shortened successfully", newUrl));
  } catch (err) {
    res.status(err.status || 500).json(wrapperMessage("failed", err.message));
  }
};

exports.RedirectUrl = async (req, res, next) => {
  try {
    const key = req.params.key;
    const url = await Urls.findOne({key: key});
    if(!url){
        let err = new Error("URL not found");
        err.status = 404;
        throw err;
    }
    res.redirect(url.url);
  } catch (err) {
    res.status(err.status || 500).json(wrapperMessage("failed", err.message));
  }
};
