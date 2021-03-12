module.exports.createResponse = (statusCode, { data, message, error }) => {
    const body = (message || error) ? { message, error } : data
    return {
      statusCode,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    }
  }

module.exports.parseBodyJSON = body => (typeof body === "object") ? body : JSON.parse(body || "{}")