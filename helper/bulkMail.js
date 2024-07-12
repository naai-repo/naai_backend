require('dotenv').config();
const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });
// const sqs = new AWS.SQS({ region: 'ap-south-1' });
// AWS.config.update({ region: 'ap-south-1' });
const sqs = new AWS.SQS();
const queueUrl = 'https://sqs.ap-south-1.amazonaws.com/172024021636/smsqueue';


const users = [ 'ssagar8186@gmail.com', 'sagarahubham48@gmail.com', 'shuweb47@gmail.com'];

async function sendMessagesToQueue() {
    try {
        for (const user of users) {
            const params = {
                MessageBody: JSON.stringify(user),
                QueueUrl: queueUrl
            };
            await sqs.sendMessage(params).promise();
            
        }
        console.log('All messages sent to SQS queue.');
    } catch (err) {
        console.error('Error sending messages to SQS:', err);
    }
}

sendMessagesToQueue();