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
const queueUrl = 'https://sqs.ap-south-1.amazonaws.com/172024021636/marketingMessagingQueue';

async function sendMessageToSqs(customer) {
  const params = {
    MessageBody: JSON.stringify(customer),
    QueueUrl: queueUrl
  };

  try {
    await sqs.sendMessage(params).promise();
    console.log(`Message sent to SQS for ${customer.phone}`);
  } catch (error) {
    console.error(`Failed to send message to SQS for ${customer.phone}:`, error);
  }
}

// Example customer data
const customers = [
  {
    phone: '+1234567890',
    template: 'Hello, cat1 [discount] how temp 4 are (you) [salon] doing? Hello, <cat1> [discount] how temp 4 are you {salon}',
    
      discount: '50%',
      cat1: 'Feline',
      salon: 'Beauty Salon 78'
    
  },
  {
    phone: '+1234567890',
    template: 'Hello, cat1 [discount] how temp 4 are (you) [salon] doing? Hello, <cat1> [discount] how temp 4 are you {salon}',
    
      discount: '50%',
      cat1: 'jljlkj',
      salon: 'Beauty Salon'
    
  },
  {
    phone: '+1234567890',
    template: 'Hello, cat1 [discount] how temp 4 are (you) [salon] doing? Hello, <cat1> [discount] how temp 4 are you {salon}',
    
      discount: '50%',
      cat1: 'sjhkjhs',
      salon: 'Looks Salon'
    
  },
  // Add more customer objects here...
];

// Send messages to SQS
async function sendMessagesToAllCustomers(customers) {
  const batchSize = 10; 
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);
    await Promise.all(batch.map(sendMessageToSqs));
  }
}

sendMessagesToAllCustomers(customers)
  .then(() => {
    console.log('All messages sent to SQS');
  })
  .catch(error => {
    console.error('Error sending messages to SQS:', error);
  });
