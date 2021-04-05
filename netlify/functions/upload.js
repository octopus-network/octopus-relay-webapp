const { Storage } = require('@google-cloud/storage');

const storage = new Storage({
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY.split("\\n").join("\n")
  }
});

const myBucket = storage.bucket(process.env.GCS_BUCKET_NAME);

function error(message) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: false, message
    })
  }
}

function success(data) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true, data
    })
  }
}

exports.handler = async function(event) {
  const { isBase64Encoded, body, httpMethod, queryStringParameters } = event;

  const { appchainId, isRaw } = queryStringParameters;
  
  if (!/post/i.test(httpMethod)) {
    return error('Method not support');
  }

  if (!appchainId || !isRaw) {
    return error('Missing parameters');
  }

  const destFileName = `${appchainId}/chain-spec${isRaw == 1 ? '-raw' : ''}.json`;

  const file = myBucket.file(destFileName);

  try {
    await file.save(Buffer.from(body, isBase64Encoded ? 'base64' : 'utf8'));
    return success({ link: file.metadata.mediaLink });
  } catch(err) {
    return error(err.toString());
  }

}