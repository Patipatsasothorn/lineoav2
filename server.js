require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const line = require('@line/bot-sdk');
const sql = require('mssql');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.random().toString(36).substring(7) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// SQL Server Configuration
const sqlConfig = {
  server: 'localhost',
  database: 'LineOA',
  user: 'sa',
  password: 'StrongPassw0rd!Here',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// SSE clients
let sseClients = [];

// Connect to SQL Server
let poolPromise;

async function connectDB() {
  try {
    poolPromise = sql.connect(sqlConfig);
    await poolPromise;
    console.log('✓ Connected to SQL Server');
    const result = await sql.query('SELECT DB_NAME() AS current_db');
    console.log('Current Database:', result.recordset[0].current_db);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Utility Functions
function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 5;
  const segmentLength = 5;

  let key = '';
  for (let i = 0; i < segments; i++) {
    if (i > 0) key += '-';
    for (let j = 0; j < segmentLength; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return key;
}

function checkLicenseValidity(user) {
  if (!user.licenseExpiry) return false;
  const now = new Date();
  const expiry = new Date(user.licenseExpiry);
  return now < expiry;
}

function calculateExpiryDate(duration) {
  const now = new Date();
  const expiry = new Date(now);

  if (duration.minutes) expiry.setMinutes(expiry.getMinutes() + duration.minutes);
  if (duration.days) expiry.setDate(expiry.getDate() + duration.days);
  if (duration.months) expiry.setMonth(expiry.getMonth() + duration.months);
  if (duration.years) expiry.setFullYear(expiry.getFullYear() + duration.years);

  return expiry;
}

function broadcastMessage(message) {
  sseClients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(message)}\n\n`);
  });
}

// Check Auto Reply
async function checkAutoReply(text, userId) {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT TOP 1 * FROM AutoReplies WHERE userId = @userId AND isActive = 1');

    if (result.recordset.length > 0) {
      const rule = result.recordset[0];
      if (text.toLowerCase().includes(rule.keyword.toLowerCase())) {
        return rule;
      }
    }
    return null;
  } catch (error) {
    console.error('Error checking auto reply:', error);
    return null;
  }
}

// ===== API ENDPOINTS =====

// Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const pool = await poolPromise;

    // Check Users table
    let result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .query('SELECT * FROM Users WHERE username = @username AND password = @password');

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      const isLicenseValid = checkLicenseValidity(user);

      return res.json({
        success: true,
        token: 'mockup-jwt-token-' + user.id,
        user: {
          id: user.id,
          username: user.username,
          role: user.role || 'user',
          licenseKey: user.licenseKey,
          licenseExpiry: user.licenseExpiry,
          isLicenseValid: isLicenseValid,
          createdAt: user.createdAt
        },
        message: 'Login successful'
      });
    }

    // Check Agents table
    result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .query('SELECT * FROM Agents WHERE username = @username AND password = @password AND isActive = 1');

    if (result.recordset.length > 0) {
      const agent = result.recordset[0];
      return res.json({
        success: true,
        token: 'mockup-jwt-token-agent-' + agent.id,
        user: {
          id: agent.id,
          username: agent.username,
          role: 'agent',
          ownerId: agent.userId, // Link to the main user
          licenseExpiry: null,
          isLicenseValid: true,
          createdAt: agent.createdAt
        },
        message: 'Login successful'
      });
    }

    res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  if (username.length < 3 || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Username >= 3 chars, Password >= 6 chars' });
  }

  try {
    const pool = await poolPromise;

    // Check existing user
    const checkResult = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Users WHERE username = @username');

    if (checkResult.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Insert new user
    const newUserId = Date.now().toString();
    await pool.request()
      .input('id', sql.NVarChar, newUserId)
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .input('role', sql.NVarChar, 'user')
      .query(`INSERT INTO Users (id, username, password, role, createdAt) 
              VALUES (@id, @username, @password, @role, GETDATE())`);

    res.json({
      success: true,
      message: 'Registration successful',
      user: { id: newUserId, username, role: 'user' }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// SSE endpoint
app.get('/api/messages/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  req.on('close', () => {
    sseClients = sseClients.filter(client => client.id !== clientId);
  });
});

// Add Channel
app.post('/api/channels', async (req, res) => {
  const { channelSecret, channelAccessToken, channelName, userId } = req.body;

  if (!channelSecret || !channelAccessToken || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;
    const newChannelId = Date.now().toString();

    await pool.request()
      .input('id', sql.NVarChar, newChannelId)
      .input('secret', sql.NVarChar, channelSecret)
      .input('token', sql.NVarChar, channelAccessToken)
      .input('name', sql.NVarChar, channelName || `LINE Channel ${newChannelId}`)
      .input('userId', sql.NVarChar, userId)
      .query(`INSERT INTO Channels (id, channelSecret, channelAccessToken, channelName, userId, createdAt)
              VALUES (@id, @secret, @token, @name, @userId, GETDATE())`);

    res.json({ success: true, message: 'Channel added successfully', channel: { id: newChannelId } });
  } catch (error) {
    console.error('Add channel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Channels
app.get('/api/channels', async (req, res) => {
  const { userId, agentId } = req.query;

  if (!userId && !agentId) {
    return res.status(400).json({ success: false, message: 'User ID or Agent ID is required' });
  }

  try {
    const pool = await poolPromise;
    let result;

    if (agentId) {
      // Filter by agent assigned channels
      result = await pool.request()
        .input('agentId', sql.NVarChar, agentId)
        .query(`SELECT c.* FROM Channels c
                INNER JOIN AgentChannels ac ON c.id = ac.channelId
                WHERE ac.agentId = @agentId
                ORDER BY c.createdAt DESC`);
    } else {
      // Otherwise get all channels for the user
      result = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query('SELECT * FROM Channels WHERE userId = @userId ORDER BY createdAt DESC');
    }

    res.json({ success: true, channels: result.recordset });
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Channel
app.delete('/api/channels/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM Channels WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Channel not found or no permission' });
    }

    // Delete
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Channels WHERE id = @id');

    res.json({ success: true, message: 'Channel removed successfully' });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Messages
app.get('/api/messages', async (req, res) => {
  const { userId, agentId } = req.query;

  if (!userId && !agentId) {
    return res.status(400).json({ success: false, message: 'User ID or Agent ID is required' });
  }

  try {
    const pool = await poolPromise;
    let result;

    if (agentId) {
      // Filter by agent assigned channels
      result = await pool.request()
        .input('agentId', sql.NVarChar, agentId)
        .query(`SELECT m.* FROM Messages m
                INNER JOIN AgentChannels ac ON m.channelId = ac.channelId
                WHERE ac.agentId = @agentId
                ORDER BY m.timestamp ASC`);
    } else {
      // Filter by user owned channels
      result = await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query(`SELECT m.* FROM Messages m
                INNER JOIN Channels c ON m.channelId = c.id
                WHERE c.userId = @userId
                ORDER BY m.timestamp ASC`);
    }

    res.json({ success: true, messages: result.recordset });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Webhook
app.post('/webhook/:channelId', async (req, res) => {
  const { channelId } = req.params;
  const events = req.body.events;

  console.log('Webhook received for channel:', channelId);

  try {
    const pool = await poolPromise;
    const channelResult = await pool.request()
      .input('channelId', sql.NVarChar, channelId)
      .query('SELECT * FROM Channels WHERE id = @channelId');

    if (channelResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channel = channelResult.recordset[0];
    const client = new line.Client({ channelAccessToken: channel.channelAccessToken });

    if (events && events.length > 0) {
      for (const event of events) {
        if (event.type === 'message') {
          let userName = 'User';
          try {
            const profile = await client.getProfile(event.source.userId);
            userName = profile.displayName;
          } catch (error) {
            console.error('Error getting profile:', error);
          }

          let messageText = '';
          let messageType = 'text';
          let imageUrl = null;
          let stickerPackageId = null;
          let stickerId = null;

          if (event.message.type === 'text') {
            messageText = event.message.text;
            messageType = 'text';
          } else if (event.message.type === 'image') {
            messageText = '[รูปภาพ]';
            messageType = 'image';
          } else if (event.message.type === 'sticker') {
            messageText = `[สติกเกอร์: ${event.message.packageId}/${event.message.stickerId}]`;
            messageType = 'sticker';
            stickerPackageId = event.message.packageId;
            stickerId = event.message.stickerId;
          } else {
            messageText = `[${event.message.type}]`;
            messageType = event.message.type;
          }

          // Save message
          const newMessageId = Date.now().toString() + Math.random();
          await pool.request()
            .input('id', sql.NVarChar, newMessageId)
            .input('channelId', sql.NVarChar, channelId)
            .input('channelName', sql.NVarChar, channel.channelName)
            .input('userId', sql.NVarChar, event.source.userId)
            .input('userName', sql.NVarChar, userName)
            .input('text', sql.NVarChar, messageText)
            .input('messageType', sql.NVarChar, messageType)
            .input('imageUrl', sql.NVarChar, imageUrl)
            .input('stickerPackageId', sql.NVarChar, stickerPackageId)
            .input('stickerId', sql.NVarChar, stickerId)
            .input('timestamp', sql.BigInt, event.timestamp)
            .input('type', sql.NVarChar, 'received')
            .input('isRead', sql.Bit, 0)
            .query(`INSERT INTO Messages (id, channelId, channelName, userId, userName, text, messageType, imageUrl, stickerPackageId, stickerId, timestamp, type, isRead)
                    VALUES (@id, @channelId, @channelName, @userId, @userName, @text, @messageType, @imageUrl, @stickerPackageId, @stickerId, @timestamp, @type, @isRead)`);

          const newMessage = {
            id: newMessageId,
            channelId: channelId,
            channelName: channel.channelName,
            userId: event.source.userId,
            userName: userName,
            text: messageText,
            messageType: messageType,
            timestamp: event.timestamp,
            type: 'received',
            isRead: false
          };

          broadcastMessage({ type: 'new_message', message: newMessage });

          // Auto Reply
          if (messageType === 'text') {
            const matchedRule = await checkAutoReply(messageText, channel.userId);
            if (matchedRule) {
              console.log(`🤖 Auto reply triggered`);

              try {
                await client.replyMessage(event.replyToken, {
                  type: 'text',
                  text: matchedRule.reply
                });

                // Save auto reply message
                const autoReplyId = Date.now().toString() + Math.random();
                await pool.request()
                  .input('id', sql.NVarChar, autoReplyId)
                  .input('channelId', sql.NVarChar, channelId)
                  .input('channelName', sql.NVarChar, channel.channelName)
                  .input('userId', sql.NVarChar, event.source.userId)
                  .input('userName', sql.NVarChar, 'Auto Reply')
                  .input('text', sql.NVarChar, matchedRule.reply)
                  .input('timestamp', sql.BigInt, Date.now())
                  .input('type', sql.NVarChar, 'sent')
                  .input('isAutoReply', sql.Bit, 1)
                  .query(`INSERT INTO Messages (id, channelId, channelName, userId, userName, text, messageType, timestamp, type, isRead, isAutoReply)
                          VALUES (@id, @channelId, @channelName, @userId, @userName, @text, 'text', @timestamp, @type, 1, @isAutoReply)`);

                console.log('✓ Auto reply sent');
              } catch (error) {
                console.error('Error sending auto reply:', error);
              }
            }
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

// Send Message
app.post('/api/messages/send', async (req, res) => {
  const { channelId, userId, text, messageType, imageUrl, stickerPackageId, stickerId, senderId } = req.body;

  try {
    const pool = await poolPromise;

    // Get channel
    const channelResult = await pool.request()
      .input('channelId', sql.NVarChar, channelId)
      .query('SELECT * FROM Channels WHERE id = @channelId');

    if (channelResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Channel not found' });
    }

    const channel = channelResult.recordset[0];

    // Check license
    if (senderId) {
      const userResult = await pool.request()
        .input('senderId', sql.NVarChar, senderId)
        .query('SELECT * FROM Users WHERE id = @senderId');

      if (userResult.recordset.length > 0) {
        const sender = userResult.recordset[0];
        if (sender.role !== 'admin') {
          const isLicenseValid = checkLicenseValidity(sender);
          if (!isLicenseValid) {
            return res.status(403).json({
              success: false,
              message: 'License expired',
              code: 'LICENSE_EXPIRED'
            });
          }
        }
      }
    }

    const client = new line.Client({ channelAccessToken: channel.channelAccessToken });

    let lineMessage;
    let displayText = text;

    if (messageType === 'image' && imageUrl) {
      let fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000${imageUrl}`;

      if (fullImageUrl.includes('localhost')) {
        lineMessage = { type: 'text', text: '📷 [รูปภาพ]\n\n⚠️ ไม่สามารถส่งรูปได้เนื่องจากใช้ localhost' };
        displayText = '[รูปภาพ - ไม่สามารถส่งได้]';
      } else {
        lineMessage = { type: 'image', originalContentUrl: fullImageUrl, previewImageUrl: fullImageUrl };
        displayText = '[รูปภาพ]';
      }
    } else if (messageType === 'sticker' && stickerPackageId && stickerId) {
      lineMessage = { type: 'sticker', packageId: stickerPackageId, stickerId: stickerId };
      displayText = `[สติกเกอร์: ${stickerPackageId}/${stickerId}]`;
    } else {
      lineMessage = { type: 'text', text: text };
    }

    await client.pushMessage(userId, lineMessage);

    // Save message
    const newMessageId = Date.now().toString() + Math.random();
    await pool.request()
      .input('id', sql.NVarChar, newMessageId)
      .input('channelId', sql.NVarChar, channelId)
      .input('channelName', sql.NVarChar, channel.channelName)
      .input('userId', sql.NVarChar, userId)
      .input('userName', sql.NVarChar, 'Me')
      .input('text', sql.NVarChar, displayText)
      .input('messageType', sql.NVarChar, messageType || 'text')
      .input('imageUrl', sql.NVarChar, imageUrl)
      .input('stickerPackageId', sql.NVarChar, stickerPackageId)
      .input('stickerId', sql.NVarChar, stickerId)
      .input('timestamp', sql.BigInt, Date.now())
      .input('type', sql.NVarChar, 'sent')
      .query(`INSERT INTO Messages (id, channelId, channelName, userId, userName, text, messageType, imageUrl, stickerPackageId, stickerId, timestamp, type, isRead)
              VALUES (@id, @channelId, @channelName, @userId, @userName, @text, @messageType, @imageUrl, @stickerPackageId, @stickerId, @timestamp, @type, 1)`);

    const newMessage = {
      id: newMessageId,
      text: displayText,
      type: 'sent',
      timestamp: Date.now()
    };

    broadcastMessage({ type: 'new_message', message: newMessage });

    res.json({ success: true, message: 'Message sent successfully', data: newMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message' });
  }
});

// ===== Agent Management =====

// Get Agents
app.get('/api/agents', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM Agents WHERE userId = @userId ORDER BY createdAt DESC');

    res.json({ success: true, agents: result.recordset });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Agent
app.post('/api/agents', async (req, res) => {
  const { name, username, password, userId } = req.body;

  if (!username || !password || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;

    // Check if username already exists in Users or Agents
    const checkUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Users WHERE username = @username');

    const checkAgent = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Agents WHERE username = @username');

    if (checkUser.recordset.length > 0 || checkAgent.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const newAgentId = Date.now().toString();
    await pool.request()
      .input('id', sql.NVarChar, newAgentId)
      .input('name', sql.NVarChar, name || null)
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .input('userId', sql.NVarChar, userId)
      .query(`INSERT INTO Agents (id, name, username, password, userId, createdAt, isActive)
              VALUES (@id, @name, @username, @password, @userId, GETDATE(), 1)`);

    res.json({ success: true, message: 'Agent created successfully', agent: { id: newAgentId } });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Agent
app.put('/api/agents/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username, password, isActive, userId } = req.body;

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM Agents WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found or no permission' });
    }

    // Build update query
    let updateFields = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    if (name !== undefined) {
      updateFields.push('name = @name');
      request.input('name', sql.NVarChar, name);
    }
    if (username !== undefined) {
      updateFields.push('username = @username');
      request.input('username', sql.NVarChar, username);
    }
    if (password) {
      updateFields.push('password = @password');
      request.input('password', sql.NVarChar, password);
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = @isActive');
      request.input('isActive', sql.Bit, isActive ? 1 : 0);
    }

    if (updateFields.length > 0) {
      await request.query(`UPDATE Agents SET ${updateFields.join(', ')} WHERE id = @id`);
    }

    res.json({ success: true, message: 'Agent updated successfully' });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Agent
app.delete('/api/agents/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM Agents WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found or no permission' });
    }

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Agents WHERE id = @id');

    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Assigned Channels for Agent
app.get('/api/agents/:id/channels', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('agentId', sql.NVarChar, id)
      .query('SELECT channelId FROM AgentChannels WHERE agentId = @agentId');

    res.json({ success: true, channelIds: result.recordset.map(r => r.channelId) });
  } catch (error) {
    console.error('Get agent channels error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Assigned Channels for Agent
app.post('/api/agents/:id/channels', async (req, res) => {
  const { id } = req.params;
  const { channelIds, userId } = req.body;

  try {
    const pool = await poolPromise;

    // Check if the agent belongs to the user
    const checkAgent = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM Agents WHERE id = @id AND userId = @userId');

    if (checkAgent.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Delete existing assignments
    await pool.request()
      .input('agentId', sql.NVarChar, id)
      .query('DELETE FROM AgentChannels WHERE agentId = @agentId');

    // Add new assignments
    if (channelIds && channelIds.length > 0) {
      for (const channelId of channelIds) {
        await pool.request()
          .input('agentId', sql.NVarChar, id)
          .input('channelId', sql.NVarChar, channelId)
          .query('INSERT INTO AgentChannels (agentId, channelId) VALUES (@agentId, @channelId)');
      }
    }

    res.json({ success: true, message: 'Channels assigned successfully' });
  } catch (error) {
    console.error('Assign channels error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload Image
app.post('/api/upload/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.json({
      success: true,
      imageUrl: `/uploads/${req.file.filename}`,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload image' });
  }
});

// Mark as Read
app.post('/api/messages/mark-read', async (req, res) => {
  const { userId, channelId } = req.body;

  try {
    const pool = await poolPromise;

    if (channelId) {
      await pool.request()
        .input('userId', sql.NVarChar, userId)
        .input('channelId', sql.NVarChar, channelId)
        .query(`UPDATE Messages SET isRead = 1 
                WHERE userId = @userId AND channelId = @channelId AND type = 'received' AND isRead = 0`);
    } else {
      await pool.request()
        .input('userId', sql.NVarChar, userId)
        .query(`UPDATE Messages SET isRead = 1 
                WHERE userId = @userId AND type = 'received' AND isRead = 0`);
    }

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== Groups Management =====

// Get Groups
app.get('/api/groups', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query(`SELECT g.*, 
              (SELECT gc.userId, gc.channelId 
               FROM GroupConversations gc 
               WHERE gc.groupId = g.id 
               FOR JSON PATH) as ConversationsJson
              FROM ConversationGroups g 
              WHERE g.userId = @userId 
              ORDER BY g.updatedAt DESC`);

    const groups = result.recordset.map(g => ({
      ...g,
      conversations: g.ConversationsJson ? JSON.parse(g.ConversationsJson) : []
    }));

    res.json({ success: true, groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Group
app.post('/api/groups', async (req, res) => {
  const { name, conversations, userId } = req.body;

  if (!name || !conversations || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;
    const newGroupId = Date.now().toString();

    // Insert group
    await pool.request()
      .input('id', sql.NVarChar, newGroupId)
      .input('name', sql.NVarChar, name)
      .input('userId', sql.NVarChar, userId)
      .query(`INSERT INTO ConversationGroups (id, name, userId, createdAt, updatedAt)
              VALUES (@id, @name, @userId, GETDATE(), GETDATE())`);

    // Insert conversations
    for (const conv of conversations) {
      await pool.request()
        .input('groupId', sql.NVarChar, newGroupId)
        .input('userId', sql.NVarChar, conv.userId)
        .input('channelId', sql.NVarChar, conv.channelId)
        .query(`INSERT INTO GroupConversations (groupId, userId, channelId)
                VALUES (@groupId, @userId, @channelId)`);
    }

    res.json({ success: true, message: 'Group created successfully', group: { id: newGroupId } });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Group
app.put('/api/groups/:id', async (req, res) => {
  const { id } = req.params;
  const { name, conversations, userId } = req.body;

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM ConversationGroups WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found or no permission' });
    }

    // Update group
    if (name) {
      await pool.request()
        .input('id', sql.NVarChar, id)
        .input('name', sql.NVarChar, name)
        .query(`UPDATE ConversationGroups SET name = @name, updatedAt = GETDATE() WHERE id = @id`);
    }

    // Update conversations
    if (conversations) {
      await pool.request()
        .input('groupId', sql.NVarChar, id)
        .query('DELETE FROM GroupConversations WHERE groupId = @groupId');

      for (const conv of conversations) {
        await pool.request()
          .input('groupId', sql.NVarChar, id)
          .input('userId', sql.NVarChar, conv.userId)
          .input('channelId', sql.NVarChar, conv.channelId)
          .query(`INSERT INTO GroupConversations (groupId, userId, channelId)
                  VALUES (@groupId, @userId, @channelId)`);
      }
    }

    res.json({ success: true, message: 'Group updated successfully' });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Group
app.delete('/api/groups/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM ConversationGroups WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Group not found or no permission' });
    }

    // Delete (CASCADE will delete GroupConversations)
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM ConversationGroups WHERE id = @id');

    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== License Management =====

// Generate License (Admin)
app.post('/api/admin/licenses/generate', async (req, res) => {
  const { duration, adminUserId } = req.body;

  try {
    const pool = await poolPromise;

    // Check admin
    const adminResult = await pool.request()
      .input('adminUserId', sql.NVarChar, adminUserId)
      .query('SELECT id FROM Users WHERE id = @adminUserId AND role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    if (!duration || (!duration.minutes && !duration.days && !duration.months && !duration.years)) {
      return res.status(400).json({ success: false, message: 'Duration is required' });
    }

    const licenseKey = generateLicenseKey();
    const expiryDate = calculateExpiryDate(duration);
    const newLicenseId = Date.now().toString();

    await pool.request()
      .input('id', sql.NVarChar, newLicenseId)
      .input('key', sql.NVarChar, licenseKey)
      .input('minutes', sql.Int, duration.minutes || null)
      .input('days', sql.Int, duration.days || null)
      .input('months', sql.Int, duration.months || null)
      .input('years', sql.Int, duration.years || null)
      .input('expiresAt', sql.DateTime, expiryDate)
      .input('createdBy', sql.NVarChar, adminUserId)
      .query(`INSERT INTO Licenses (id, licenseKey, durationMinutes, durationDays, durationMonths, durationYears, expiresAt, createdAt, createdBy, status)
              VALUES (@id, @key, @minutes, @days, @months, @years, @expiresAt, GETDATE(), @createdBy, 'unused')`);

    console.log(`✓ License generated: ${licenseKey}`);

    res.json({
      success: true,
      message: 'License generated successfully',
      license: { id: newLicenseId, key: licenseKey, expiresAt: expiryDate }
    });
  } catch (error) {
    console.error('Generate license error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get All Licenses (Admin)
app.get('/api/admin/licenses', async (req, res) => {
  const { adminUserId } = req.query;

  try {
    const pool = await poolPromise;

    // Check admin
    const adminResult = await pool.request()
      .input('adminUserId', sql.NVarChar, adminUserId)
      .query('SELECT id FROM Users WHERE id = @adminUserId AND role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const result = await pool.request()
      .query('SELECT * FROM Licenses ORDER BY createdAt DESC');

    res.json({ success: true, licenses: result.recordset });
  } catch (error) {
    console.error('Get licenses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete License (Admin)
app.delete('/api/licenses/delete/:id', async (req, res) => {
  const { id } = req.params;
  const { adminUserId } = req.body;

  try {
    const pool = await poolPromise;

    // Check admin
    const adminResult = await pool.request()
      .input('adminUserId', sql.NVarChar, adminUserId)
      .query('SELECT id FROM Users WHERE id = @adminUserId AND role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    // Check if license exists
    const licenseResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .query('SELECT id, licenseKey, status FROM Licenses WHERE id = @id');

    if (licenseResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    // Delete license
    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Licenses WHERE id = @id');

    console.log(`✓ License deleted: ${licenseResult.recordset[0].licenseKey}`);

    res.json({
      success: true,
      message: 'License deleted successfully'
    });
  } catch (error) {
    console.error('Delete license error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Activate License - แก้ไขให้ไม่สามารถใช้ License ที่ active แล้วซ้ำได้
app.post('/api/license/activate', async (req, res) => {
  const { licenseKey, userId } = req.body;

  if (!licenseKey || !userId) {
    return res.status(400).json({
      success: false,
      message: 'License key and user ID are required'
    });
  }

  try {
    const pool = await poolPromise;

    // Get user
    const userResult = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM Users WHERE id = @userId');

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get license
    const licenseResult = await pool.request()
      .input('key', sql.NVarChar, licenseKey.trim())
      .query('SELECT * FROM Licenses WHERE licenseKey = @key');

    if (licenseResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'License Key ไม่ถูกต้องหรือไม่มีในระบบ'
      });
    }

    const license = licenseResult.recordset[0];

    // ✅ ตรวจสอบว่า License มี status = 'active' แล้วหรือไม่
    if (license.status === 'active') {
      // ถ้า License ถูกใช้โดยคนอื่นแล้ว ห้ามใช้ซ้ำ
      if (license.activatedBy && license.activatedBy !== userId) {
        return res.status(400).json({
          success: false,
          message: 'License Key นี้ถูกใช้งานโดยผู้ใช้อื่นแล้ว ไม่สามารถใช้ซ้ำได้'
        });
      }

      // ถ้า License ถูกใช้โดยคนเดียวกัน ก็ไม่ให้ใช้ซ้ำเช่นกัน
      if (license.activatedBy === userId) {
        return res.status(400).json({
          success: false,
          message: 'คุณได้ใช้งาน License Key นี้ไปแล้ว ไม่สามารถใช้ซ้ำได้'
        });
      }
    }

    // ✅ ตรวจสอบว่า License หมดอายุหรือยัง (สำหรับ License ที่เคยใช้แล้ว)
    if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'License Key นี้หมดอายุแล้ว'
      });
    }

    // Calculate new expiry date
    const duration = {
      minutes: license.durationMinutes,
      days: license.durationDays,
      months: license.durationMonths,
      years: license.durationYears
    };
    const expiryDate = calculateExpiryDate(duration);

    // Update license to active status
    await pool.request()
      .input('key', sql.NVarChar, licenseKey.trim())
      .input('userId', sql.NVarChar, userId)
      .input('expiresAt', sql.DateTime, expiryDate)
      .query(`UPDATE Licenses 
              SET status = 'active', 
                  activatedBy = @userId, 
                  activatedAt = GETDATE(), 
                  expiresAt = @expiresAt 
              WHERE licenseKey = @key`);

    // Update user's license info
    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('key', sql.NVarChar, licenseKey.trim())
      .input('expiry', sql.DateTime, expiryDate)
      .query(`UPDATE Users 
              SET licenseKey = @key, 
                  licenseExpiry = @expiry 
              WHERE id = @userId`);

    console.log(`✅ License activated: ${licenseKey} for user ${userId}`);

    res.json({
      success: true,
      message: 'เปิดใช้งาน License สำเร็จ',
      expiresAt: expiryDate
    });

  } catch (error) {
    console.error('❌ Activate license error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดของระบบ'
    });
  }
});

// Get License Status
app.get('/api/license/status', async (req, res) => {
  const { userId } = req.query;

  console.log('📋 Checking license status for userId:', userId);

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM Users WHERE id = @userId');

    console.log('📋 User found:', result.recordset.length > 0);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.recordset[0];
    const isValid = checkLicenseValidity(user);

    console.log('📋 License info:', {
      hasLicense: !!user.licenseKey,
      isValid,
      expiresAt: user.licenseExpiry
    });

    res.json({
      success: true,
      hasLicense: !!user.licenseKey,
      licenseKey: user.licenseKey,
      expiresAt: user.licenseExpiry,
      isValid: isValid,
      remainingTime: isValid ? new Date(user.licenseExpiry) - new Date() : 0
    });
  } catch (error) {
    console.error('Get license status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== Admin User Management =====

// Get All Users (Admin)
app.get('/api/admin/users', async (req, res) => {
  const { adminUserId } = req.query;

  try {
    const pool = await poolPromise;

    // Check admin
    const adminResult = await pool.request()
      .input('adminUserId', sql.NVarChar, adminUserId)
      .query('SELECT id FROM Users WHERE id = @adminUserId AND role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    const result = await pool.request()
      .query('SELECT id, username, role, licenseKey, licenseExpiry, createdAt FROM Users ORDER BY createdAt DESC');

    const users = result.recordset.map(u => ({
      ...u,
      isLicenseValid: checkLicenseValidity(u)
    }));

    res.json({ success: true, users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update User Role (Admin)
app.put('/api/admin/users/:userId/role', async (req, res) => {
  const { userId } = req.params;
  const { role, adminUserId } = req.body;

  try {
    const pool = await poolPromise;

    // Check admin
    const adminResult = await pool.request()
      .input('adminUserId', sql.NVarChar, adminUserId)
      .query('SELECT id FROM Users WHERE id = @adminUserId AND role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('role', sql.NVarChar, role)
      .query('UPDATE Users SET role = @role WHERE id = @userId');

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reset Password (Admin)
app.put('/api/admin/users/:userId/reset-password', async (req, res) => {
  const { userId } = req.params;
  const { newPassword, adminUserId } = req.body;

  try {
    const pool = await poolPromise;

    // Check admin
    const adminResult = await pool.request()
      .input('adminUserId', sql.NVarChar, adminUserId)
      .query('SELECT id FROM Users WHERE id = @adminUserId AND role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('password', sql.NVarChar, newPassword)
      .query('UPDATE Users SET password = @password WHERE id = @userId');

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete User (Admin)
app.delete('/api/admin/users/:userId', async (req, res) => {
  const { userId } = req.params;
  const { adminUserId } = req.query;

  try {
    const pool = await poolPromise;

    // Check admin
    const adminResult = await pool.request()
      .input('adminUserId', sql.NVarChar, adminUserId)
      .query('SELECT id FROM Users WHERE id = @adminUserId AND role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    if (userId === adminUserId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('DELETE FROM Users WHERE id = @userId');

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add License to User (Admin)
app.post('/api/admin/users/:userId/add-license', async (req, res) => {
  const { userId } = req.params;
  const { licenseKey, adminUserId } = req.body;

  try {
    const pool = await poolPromise;

    // Check admin
    const adminResult = await pool.request()
      .input('adminUserId', sql.NVarChar, adminUserId)
      .query('SELECT id FROM Users WHERE id = @adminUserId AND role = \'admin\'');

    if (adminResult.recordset.length === 0) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin only.' });
    }

    // Get license
    const licenseResult = await pool.request()
      .input('key', sql.NVarChar, licenseKey)
      .query('SELECT * FROM Licenses WHERE licenseKey = @key');

    if (licenseResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid license key' });
    }

    const license = licenseResult.recordset[0];

    if (license.status === 'active' && license.activatedBy !== userId) {
      return res.status(400).json({ success: false, message: 'License already used by another user' });
    }

    // Calculate expiry
    const duration = {
      minutes: license.durationMinutes,
      days: license.durationDays,
      months: license.durationMonths,
      years: license.durationYears
    };
    const expiryDate = calculateExpiryDate(duration);

    // Update license
    await pool.request()
      .input('key', sql.NVarChar, licenseKey)
      .input('userId', sql.NVarChar, userId)
      .input('expiresAt', sql.DateTime, expiryDate)
      .query(`UPDATE Licenses 
              SET status = 'active', activatedBy = @userId, activatedAt = GETDATE(), expiresAt = @expiresAt 
              WHERE licenseKey = @key`);

    // Update user
    await pool.request()
      .input('userId', sql.NVarChar, userId)
      .input('key', sql.NVarChar, licenseKey)
      .input('expiry', sql.DateTime, expiryDate)
      .query(`UPDATE Users SET licenseKey = @key, licenseExpiry = @expiry WHERE id = @userId`);

    res.json({ success: true, message: 'License added successfully', expiresAt: expiryDate });
  } catch (error) {
    console.error('Add license error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== Auto Reply Management =====

// Get Auto Replies
app.get('/api/auto-replies', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM AutoReplies WHERE userId = @userId ORDER BY createdAt DESC');

    res.json({ success: true, autoReplies: result.recordset });
  } catch (error) {
    console.error('Get auto replies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Auto Reply
app.post('/api/auto-replies', async (req, res) => {
  const { keyword, reply, userId, isActive } = req.body;

  if (!keyword || !reply || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;
    const newRuleId = Date.now().toString();

    await pool.request()
      .input('id', sql.NVarChar, newRuleId)
      .input('keyword', sql.NVarChar, keyword)
      .input('reply', sql.NVarChar, reply)
      .input('userId', sql.NVarChar, userId)
      .input('isActive', sql.Bit, isActive !== false ? 1 : 0)
      .query(`INSERT INTO AutoReplies (id, keyword, reply, userId, isActive, createdAt)
              VALUES (@id, @keyword, @reply, @userId, @isActive, GETDATE())`);

    console.log(`✓ Auto reply created: "${keyword}" -> "${reply}"`);

    res.json({ success: true, message: 'Auto reply created successfully', autoReply: { id: newRuleId } });
  } catch (error) {
    console.error('Create auto reply error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Auto Reply
app.put('/api/auto-replies/:id', async (req, res) => {
  const { id } = req.params;
  const { keyword, reply, isActive, userId } = req.body;

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM AutoReplies WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Auto reply not found or no permission' });
    }

    // Build update query dynamically
    let updateFields = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    if (keyword !== undefined) {
      updateFields.push('keyword = @keyword');
      request.input('keyword', sql.NVarChar, keyword);
    }
    if (reply !== undefined) {
      updateFields.push('reply = @reply');
      request.input('reply', sql.NVarChar, reply);
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = @isActive');
      request.input('isActive', sql.Bit, isActive ? 1 : 0);
    }

    if (updateFields.length > 0) {
      await request.query(`UPDATE AutoReplies SET ${updateFields.join(', ')} WHERE id = @id`);
    }

    console.log(`✓ Auto reply updated: ${id}`);

    res.json({ success: true, message: 'Auto reply updated successfully' });
  } catch (error) {
    console.error('Update auto reply error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Auto Reply
app.delete('/api/auto-replies/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM AutoReplies WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Auto reply not found or no permission' });
    }

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM AutoReplies WHERE id = @id');

    console.log(`✓ Auto reply deleted: ${id}`);

    res.json({ success: true, message: 'Auto reply deleted successfully' });
  } catch (error) {
    console.error('Delete auto reply error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Toggle Auto Reply Status
app.patch('/api/auto-replies/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const pool = await poolPromise;

    // Check ownership and get current status
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id, isActive FROM AutoReplies WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Auto reply not found or no permission' });
    }

    const currentStatus = checkResult.recordset[0].isActive;
    const newStatus = !currentStatus;

    await pool.request()
      .input('id', sql.NVarChar, id)
      .input('isActive', sql.Bit, newStatus ? 1 : 0)
      .query('UPDATE AutoReplies SET isActive = @isActive WHERE id = @id');

    console.log(`✓ Auto reply toggled: ${id} -> ${newStatus ? 'active' : 'inactive'}`);

    res.json({ success: true, message: 'Auto reply status toggled', isActive: newStatus });
  } catch (error) {
    console.error('Toggle auto reply error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===== Agent Management =====

// Get Agents
app.get('/api/agents', async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required' });
  }

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.NVarChar, userId)
      .query('SELECT * FROM Agents WHERE userId = @userId ORDER BY createdAt DESC');

    res.json({ success: true, agents: result.recordset });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create Agent
app.post('/api/agents', async (req, res) => {
  const { name, username, password, userId } = req.body;

  if (!username || !password || !userId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const pool = await poolPromise;

    // Check if username already exists in Users or Agents
    const checkUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Users WHERE username = @username');

    const checkAgent = await pool.request()
      .input('username', sql.NVarChar, username)
      .query('SELECT id FROM Agents WHERE username = @username');

    if (checkUser.recordset.length > 0 || checkAgent.recordset.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const newAgentId = Date.now().toString();
    await pool.request()
      .input('id', sql.NVarChar, newAgentId)
      .input('name', sql.NVarChar, name || null)
      .input('username', sql.NVarChar, username)
      .input('password', sql.NVarChar, password)
      .input('userId', sql.NVarChar, userId)
      .query(`INSERT INTO Agents (id, name, username, password, userId, createdAt, isActive)
              VALUES (@id, @name, @username, @password, @userId, GETDATE(), 1)`);

    res.json({ success: true, message: 'Agent created successfully', agent: { id: newAgentId } });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Agent
app.put('/api/agents/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username, password, isActive, userId } = req.body;

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM Agents WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found or no permission' });
    }

    // Build update query
    let updateFields = [];
    const request = pool.request().input('id', sql.NVarChar, id);

    if (name !== undefined) {
      updateFields.push('name = @name');
      request.input('name', sql.NVarChar, name);
    }
    if (username !== undefined) {
      updateFields.push('username = @username');
      request.input('username', sql.NVarChar, username);
    }
    if (password) {
      updateFields.push('password = @password');
      request.input('password', sql.NVarChar, password);
    }
    if (isActive !== undefined) {
      updateFields.push('isActive = @isActive');
      request.input('isActive', sql.Bit, isActive ? 1 : 0);
    }

    if (updateFields.length > 0) {
      await request.query(`UPDATE Agents SET ${updateFields.join(', ')} WHERE id = @id`);
    }

    res.json({ success: true, message: 'Agent updated successfully' });
  } catch (error) {
    console.error('Update agent error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Agent
app.delete('/api/agents/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  try {
    const pool = await poolPromise;

    // Check ownership
    const checkResult = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM Agents WHERE id = @id AND userId = @userId');

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found or no permission' });
    }

    await pool.request()
      .input('id', sql.NVarChar, id)
      .query('DELETE FROM Agents WHERE id = @id');

    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (error) {
    console.error('Delete agent error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Assigned Channels for Agent
app.get('/api/agents/:id/channels', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('agentId', sql.NVarChar, id)
      .query('SELECT channelId FROM AgentChannels WHERE agentId = @agentId');

    res.json({ success: true, channelIds: result.recordset.map(r => r.channelId) });
  } catch (error) {
    console.error('Get agent channels error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update Assigned Channels for Agent
app.post('/api/agents/:id/channels', async (req, res) => {
  const { id } = req.params;
  const { channelIds, userId } = req.body;

  try {
    const pool = await poolPromise;

    // Check if the agent belongs to the user
    const checkAgent = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('userId', sql.NVarChar, userId)
      .query('SELECT id FROM Agents WHERE id = @id AND userId = @userId');

    if (checkAgent.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Delete existing assignments
    await pool.request()
      .input('agentId', sql.NVarChar, id)
      .query('DELETE FROM AgentChannels WHERE agentId = @agentId');

    // Add new assignments
    if (channelIds && channelIds.length > 0) {
      for (const channelId of channelIds) {
        await pool.request()
          .input('agentId', sql.NVarChar, id)
          .input('channelId', sql.NVarChar, channelId)
          .query('INSERT INTO AgentChannels (agentId, channelId) VALUES (@agentId, @channelId)');
      }
    }

    res.json({ success: true, message: 'Channels assigned successfully' });
  } catch (error) {
    console.error('Assign channels error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});