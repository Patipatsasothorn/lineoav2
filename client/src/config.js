// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const config = {
  API_BASE_URL,
  API_ENDPOINTS: {
    // Authentication
    LOGIN: `${API_BASE_URL}/api/login`,
    REGISTER: `${API_BASE_URL}/api/register`,

    // Channels
    CHANNELS: `${API_BASE_URL}/api/channels`,

    // Messages
    MESSAGES: `${API_BASE_URL}/api/messages`,
    MESSAGES_SEND: `${API_BASE_URL}/api/messages/send`,
    MESSAGES_MARK_READ: `${API_BASE_URL}/api/messages/mark-read`,
    MESSAGES_STREAM: `${API_BASE_URL}/api/messages/stream`,

    // Groups
    GROUPS: `${API_BASE_URL}/api/groups`,

    // License
    LICENSE_ACTIVATE: `${API_BASE_URL}/api/license/activate`,
    LICENSE_STATUS: `${API_BASE_URL}/api/license/status`,

    // Admin - Licenses
    ADMIN_LICENSES_GENERATE: `${API_BASE_URL}/api/admin/licenses/generate`,
    ADMIN_LICENSES: `${API_BASE_URL}/api/admin/licenses`,

    // Admin - Users
    ADMIN_USERS: `${API_BASE_URL}/api/admin/users`,

    // Auto Replies
    AUTO_REPLIES: `${API_BASE_URL}/api/auto-replies`,

    // Upload
    UPLOAD_IMAGE: `${API_BASE_URL}/api/upload/image`,
  }
};

export default config;
