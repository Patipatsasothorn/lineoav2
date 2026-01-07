-- ลบตาราง ArchivedMessages ก่อน (ถ้ามี) เนื่องจากมี Foreign Key
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ArchivedMessages')
BEGIN
    DROP TABLE ArchivedMessages;
    PRINT 'Table ArchivedMessages dropped';
END
GO

-- ลบตาราง ArchivedConversations (ถ้ามี)
IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ArchivedConversations')
BEGIN
    DROP TABLE ArchivedConversations;
    PRINT 'Table ArchivedConversations dropped';
END
GO

-- สร้างตาราง ArchivedConversations
CREATE TABLE ArchivedConversations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    conversationKey NVARCHAR(255) NOT NULL,
    userId NVARCHAR(255) NOT NULL,
    userName NVARCHAR(255),
    channelId NVARCHAR(255) NOT NULL,
    channelName NVARCHAR(255) NOT NULL,
    messageCount INT NOT NULL DEFAULT 0,
    ownerId NVARCHAR(255) NOT NULL,
    note NVARCHAR(MAX),
    archivedAt DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_ArchivedConversations_OwnerId ON ArchivedConversations(ownerId);
CREATE INDEX IX_ArchivedConversations_ConversationKey ON ArchivedConversations(conversationKey);

PRINT 'Table ArchivedConversations created successfully';
GO

-- สร้างตาราง ArchivedMessages
CREATE TABLE ArchivedMessages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    archiveId INT NOT NULL,
    userId NVARCHAR(255) NOT NULL,
    userName NVARCHAR(255),
    channelId NVARCHAR(255) NOT NULL,
    text NVARCHAR(MAX),
    type NVARCHAR(50) NOT NULL,
    timestamp BIGINT NOT NULL,
    isRead BIT DEFAULT 0,
    messageType NVARCHAR(50) DEFAULT 'text',
    imageUrl NVARCHAR(MAX),
    stickerId NVARCHAR(255),
    stickerPackageId NVARCHAR(255),
    CONSTRAINT FK_ArchivedMessages_Archives FOREIGN KEY (archiveId) REFERENCES ArchivedConversations(id) ON DELETE CASCADE
);

CREATE INDEX IX_ArchivedMessages_ArchiveId ON ArchivedMessages(archiveId);
CREATE INDEX IX_ArchivedMessages_Timestamp ON ArchivedMessages(timestamp);

PRINT 'Table ArchivedMessages created successfully';
GO

PRINT 'All archived tables setup completed!';
