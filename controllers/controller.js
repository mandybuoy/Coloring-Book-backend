exports.handleData = (req, res) => {
    // Process the data received from the frontend
    const receivedData = req.body;
    // Perform operations or interact with models as needed
    res.json({ message: 'Data processed successfully', data: receivedData });
  };