const router = require('express').Router();
const multer = require('multer');
const crypto = require('crypto');
const sharp = require('sharp');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const User = require('../../model/customerApp/User');
const Artist = require('../../model/partnerApp/Artist');
const wrapperMessage = require('../../helper/wrapperMessage');
const Salon = require('../../model/partnerApp/Salon');

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const bucketName = process.env.S3_BUCKET_NAME;
const bucketRegion = process.env.S3_BUCKET_REGION;
const bucketAccessKey = process.env.S3_BUCKET_ACCESS_KEY;
const bucketSecretKey = process.env.S3_BUCKET_SECRET_ACCESS_KEY

const s3 = new S3Client({
    credentials: {
        accessKeyId: bucketAccessKey,
        secretAccessKey: bucketSecretKey,
    },
    region: bucketRegion
});

router.post("/user/:id/image", upload.single('image'), async(req,res) => {
    try{
        const imageName = randomImageName();
        let user = await User.findOne({_id: req.params.id});
        if(!user){
            let err = new Error("No such user found!");
            err.code = 404;
            throw err;
        }
        const buffer = await sharp(req.file.buffer).resize({height: 800, width: 600, fit: "contain"}).toBuffer();
        const putObjParams = {
            Bucket: bucketName,
            Key: "users/"+imageName,
            Body: buffer,
            ContentType: req.file.mimetype,
        }
        const putCommand = new PutObjectCommand(putObjParams);
        let data = await s3.send(putCommand);

        let imgUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/users/${imageName}`;
        user.imageUrl = imgUrl;
        user.imageKey = "users/"+imageName;
        await user.save();
        res.status(200).json(wrapperMessage("success", "Image updated successfully.", imgUrl));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

// router.get("/user/:id/image", upload.single('image'), async(req,res) => {
//     try{
//         let user = await User.findOne({_id: req.params.id});
//         if(!user){
//             let err = new Error("No such user found!");
//             err.code = 404;
//             throw err;
//         }
//         const getObjParams = {
//             Bucket: bucketName,
//             Key: user.imageKey,
//         }
//         const command = new GetObjectCommand(getObjParams);
//         const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
//         res.status(200).json(wrapperMessage("success", "", {url}));
//     }catch(err){
//         console.log(err);
//         res.status(err.code || 500).json(wrapperMessage("failed", err.message))
//     }
// })

router.get("/user/:id/image/delete", async (req, res) => {
    try{
        let user = await User.findOne({_id: req.params.id});
        if(!user){
            let err = new Error("No such user found!");
            err.code = 404;
            throw err;
        }
        const params = {
            Bucket: bucketName,
            Key: user.imageKey,
        }
        user.imageKey = '';
        user.imageUrl = '';
        await user.save();
        const command = new DeleteObjectCommand(params);
        await s3.send(command);
        res.status(200).json(wrapperMessage("success", "Image deleted Successfully!"));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

// Uploading artist profile image
router.post("/artist/:id/image", upload.single('image'), async(req,res) => {
    try{
        const imageName = randomImageName();
        let artist = await Artist.findOne({_id: req.params.id});
        if(!artist){
            let err = new Error("No such artist found!");
            err.code = 404;
            throw err;
        }
        const buffer = await sharp(req.file.buffer).resize({height: 800, width: 600, fit: "contain"}).toBuffer();
        const putObjParams = {
            Bucket: bucketName,
            Key: "artists/"+imageName,
            Body: buffer,
            ContentType: req.file.mimetype,
        }
        const putCommand = new PutObjectCommand(putObjParams);
        let data = await s3.send(putCommand);

        let imgUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/artists/${imageName}`;
        artist.imageUrl = imgUrl;
        artist.imageKey = "artists/"+imageName;
        await artist.save();
        res.status(200).json(wrapperMessage("success", "Image updated successfully.", imgUrl));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

// Artist Profile Pic Deletion
router.get("/artist/:id/image/delete", async (req, res) => {
    try{
        let artist = await Artist.findOne({_id: req.params.id});
        if(!artist){
            let err = new Error("No such artist found!");
            err.code = 404;
            throw err;
        }
        const params = {
            Bucket: bucketName,
            Key: artist.imageKey,
        }
        const command = new DeleteObjectCommand(params);
        await s3.send(command);
        artist.imageKey = '';
        artist.imageUrl = '';
        await artist.save();
        res.status(200).json(wrapperMessage("success", "Image deleted Successfully!"));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

// Upload Salons images
router.post('/salon/:id/image', upload.array("images", 10), async (req,res) => {
    try{
        let salon = await Salon.findOne({_id: req.params.id});
        if(!salon){
            let err = new Error("No such salon found!");
            err.code = 404;
            throw err;
        }
        let imagesArr = [];
        let imageResizeArr = [];
        let s3CommandArr = [];
        let imageBuffers = req.files.map(file => file.buffer);
        imageBuffers.forEach(buffer => {
            imageResizeArr.push(sharp(buffer).resize({height: 800, width: 600, fit: "contain"}).toBuffer());
        })
        imageResizeArr = await Promise.all(imageResizeArr);
        
        req.files.forEach((file, index) => {
            let imageName = randomImageName();
            let key = `salons/${req.params.id}/${imageName}`;
            let putObjParams = {
                Bucket: bucketName,
                Key: key,
                Body: imageResizeArr[index],
                ContentType: file.mimetype,
            }
            let putCommand = new PutObjectCommand(putObjParams);
            s3CommandArr.push(s3.send(putCommand));
            let imgUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/salons/${req.params.id}/${imageName}`;
            imagesArr.push({key: key, url: imgUrl});
        })
        await Promise.all(s3CommandArr);
        salon.images = [...salon.images, ...imagesArr];
        await salon.save();
        res.status(200).json(wrapperMessage("success", "Images uploaded successfully!"));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
});

// Delete All Salon images
router.get("/salon/:id/image/delete", async (req, res) => {
    try{
        let salon = await Salon.findOne({_id: req.params.id});
        if(!salon){
            let err = new Error("No such Salon found!");
            err.code = 404;
            throw err;
        }
        let images = salon.images;
        let s3CommandArr = [];
        images.forEach(image => {
            const params = {
                Bucket: bucketName,
                Key: image.key,
            }
            const command = new DeleteObjectCommand(params);
            s3CommandArr.push(s3.send(command));
        })
        await Promise.all(s3CommandArr);
        salon.images = [];
        await salon.save();
        res.status(200).json(wrapperMessage("success", "Images deleted Successfully!"));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

// Delete single salon images
router.post("/salon/:id/image/delete", async (req, res) => {
    try{
        let key = req.body.key;
        let salon = await Salon.findOne({_id: req.params.id});
        if(!salon){
            let err = new Error("No such Salon found!");
            err.code = 404;
            throw err;
        }
        const params = {
            Bucket: bucketName,
            Key: key,
        }
        const command = new DeleteObjectCommand(params);
        await s3.send(command);
        let imagesArr = salon.images.filter(image => image.key !== key);
        salon.images = imagesArr;
        await salon.save();
        res.status(200).json(wrapperMessage("success", "Image deleted Successfully!"));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

module.exports = router;