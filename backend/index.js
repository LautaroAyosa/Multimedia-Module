// Server Entrypoint

const appInstance = require('./app');
const PORT = process.env.PORT || 5000;
appInstance.listen(PORT, () => console.log(`Server running on port ${PORT}`));