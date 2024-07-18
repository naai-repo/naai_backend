const crypto = require("crypto");
const sharp = require("sharp");

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const wrapperMessage = require("../../helper/wrapperMessage");
const Salon = require("../../model/partnerApp/Salon");
const PromotionImages = require("../../model/promotions/PromotionImages");
const User = require("../../model/customerApp/User");
const sendMail = require("../../helper/sendMail");

const randomImageName = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

randomImageName();

const bucketName = process.env.S3_BUCKET_NAME;
const bucketRegion = process.env.S3_BUCKET_REGION;
const bucketAccessKey = process.env.S3_BUCKET_ACCESS_KEY;
const bucketSecretKey = process.env.S3_BUCKET_SECRET_ACCESS_KEY;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;

const s3 = new S3Client({
  credentials: {
    accessKeyId: bucketAccessKey,
    secretAccessKey: bucketSecretKey,
  },
  region: bucketRegion,
});

const MESSAGE_LENGTH = 1000;
const VAR_LENGTH = 50;

const uploadImagesTos3 = async (files, salonId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let imagesArr = [];
      let s3CommandArr = [];

      files.forEach((file, index) => {
        let imageName = randomImageName();
        let key = `promotions/whatsapp/${salonId}/${imageName}`;
        let putObjParams = {
          Bucket: bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        let putCommand = new PutObjectCommand(putObjParams);
        s3CommandArr.push(s3.send(putCommand));
        let imgUrl = `https://${bucketName}.s3.${bucketRegion}.amazonaws.com/promotions/whatsapp/${salonId}/${imageName}`;
        imagesArr.push({ key: key, url: imgUrl });
      });
      await Promise.all(s3CommandArr);
      let newPromotions = new PromotionImages({
        salonId: salonId,
        images: imagesArr,
      });
      await newPromotions.save();
      resolve(newPromotions);
    } catch (err) {
      reject(err);
    }
  });
};

function truncateString(str) {
    if (str.length <= VAR_LENGTH) {
        return str;
    }
    
    const truncated = str.slice(0, VAR_LENGTH);
    const lastSpaceIndex = truncated.lastIndexOf(' ');

    if (lastSpaceIndex === -1) {
        return truncated;
    }

    return truncated.slice(0, lastSpaceIndex);
}

const countCostOfMessage = (users, messageLength) => {
    return new Promise((resolve, reject) => {
        for(let user of users) {
            user.name = truncateString(user.name);
            user.cost = Math.ceil((messageLength + user.name.length)/MESSAGE_LENGTH);
        }
        resolve(users);
    })
}

exports.SendWhatsappPromos = async (req, res, next) => {
  try {
    let salonId = req.body.salonId;
    let message = req.body.message;
    let phoneNumbers = JSON.parse(req.body.phoneNumbers);
    if (!message || !phoneNumbers || !salonId) {
      let err = new Error("Invalid request!");
      err.code = 400;
      throw err;
    }
    let salon = await Salon.findOne({ _id: salonId });
    if (!salon) {
      let err = new Error("No such salon found!");
      err.code = 404;
      throw err;
    }

    const aggregation = [
      {
        $match: {
          phoneNumber: {
            $in: phoneNumbers,
          },
        },
      },
      {
        $project: {
          name: 1,
          phoneNumber: 1,
        },
      },
    ];

    let users = await User.aggregate(aggregation);

    let newPromotions = await uploadImagesTos3(req.files, salonId);
    let messageWithoutVar = message.split("{{var}}").join("");

    users = await countCostOfMessage(users, messageWithoutVar.length);

    let usersTable = users.map(user => {
      return `
        <tr>
          <td>${user.name}</td>
          <td>${user.phoneNumber}</td>
          <td>${user.cost}</td>
        </tr>
      `
    });

    let imagesUrlForMail = newPromotions.images.map(image => {
      return `
          <li>${image.url}</li>
      `
    });

    imagesUrlForMail = imagesUrlForMail.join("");
    usersTable = usersTable.join("");

    const htmlData = `
      <p><strong>SalonId:</strong> ${salonId}</p>
      <p><strong>Message:</strong> ${message}</p>
      <h3>Images:</h3>
      <ul>
        ${imagesUrlForMail}
      </ul>
      <h3>Users:</h3>
      <table border="2" cellpadding="2">
        <tr>
          <th>Customer Name</th>
          <th>Customer PhoneNumber</th>
          <th>Cost of Msg</th>
        </tr>
        ${usersTable}
      </table>
    `;

    sendMail(htmlData, "naai.admn@gmail.com", "WhatsApp Promotions", "WhatsApp Promotions");

    res
      .status(200)
      .json(
        wrapperMessage("success", "WhatsApp Promotions Sent Successfully!", {
          message,
          newPromotions,
          users,
        })
      );
  } catch (err) {
    console.log(err);
    res.status(err.status || 500).json(wrapperMessage("failed", err.message));
  }
};





//////////////////////


const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region
  });
// const sqs = new AWS.SQS({ region: 'ap-south-1' });
// AWS.config.update({ region: 'ap-south-1' });
const sqs = new AWS.SQS();
const queueUrl = 'https://sqs.ap-south-1.amazonaws.com/172024021636/smsqueue';

async function sendMessageToSqs(customers) {
  const params = {
    MessageBody: JSON.stringify(customers),
    QueueUrl: queueUrl
  };
console.log(params)
  try {
    await sqs.sendMessage(params).promise();
    console.log(`Message sent to SQS for`);
  } catch (error) {
    console.error(`Failed to send message to SQS for`, error);
  }
}

exports.sendCustomersToQueueForSms = async (req, res) =>{

  const customers = req.body.customers;

  if (!customers || !Array.isArray(customers)) {
    return res.status(400).json({ error: 'Invalid input. Please provide an array of customers.' });
  }

  try {
    await sendMessageToSqs(customers);
    res.status(200).json({ message: 'All messages sent to SQS' });
  } catch (error) {
    console.error('Error sending messages to SQS:', error);
    res.status(500).json({ error: 'Failed to send messages to SQS' });
  }

 

}

// Example customer data


// Send messages to S









